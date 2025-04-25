import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Maximum retry attempts for OpenAI requests
const MAX_RETRIES = 3;

/**
 * Validate if the provided string is valid JSON in the expected format
 * @param {string} jsonString - String to validate as JSON
 * @returns {Object} Object with validation result and parsed data or error
 */
const validateMenuJSON = (jsonString) => {
  try {
    // First check if it's valid JSON at all
    const parsedData = JSON.parse(jsonString);
    
    // Check for required structure
    if (!parsedData.restaurant_name) {
      return {
        isValid: false,
        error: 'Missing restaurant_name field',
        data: null
      };
    }
    
    if (!Array.isArray(parsedData.menu)) {
      return {
        isValid: false,
        error: 'Menu field must be an array',
        data: null
      };
    }
    
    // Check each category
    for (const category of parsedData.menu) {
      if (!category.category) {
        return {
          isValid: false,
          error: 'Category missing category name field',
          data: null
        };
      }
      
      if (!Array.isArray(category.items)) {
        return {
          isValid: false,
          error: 'Category items must be an array',
          data: null
        };
      }
      
      // Check each menu item
      for (const item of category.items) {
        if (!item.id) {
          return {
            isValid: false,
            error: 'Menu item missing id field',
            data: null
          };
        }
        
        if (!item.name) {
          return {
            isValid: false,
            error: 'Menu item missing name field',
            data: null
          };
        }
        
        if (typeof item.price !== 'number') {
          return {
            isValid: false,
            error: 'Menu item price must be a number',
            data: null
          };
        }
      }
    }
    
    // If we passed all checks
    return {
      isValid: true,
      error: null,
      data: parsedData
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid JSON: ${error.message}`,
      data: null
    };
  }
};

/**
 * Extracts menu information from images using OpenAI's Vision API
 * @param {Array<String>} imagePaths - Array of image file paths
 * @returns {Promise<Object>} Extracted menu data in the required format
 */
export const extractMenuFromImages = async (imagePaths) => {
  let retryCount = 0;
  let lastError = null;
  
  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`[OpenAI] Starting menu extraction process with ${imagePaths.length} images (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      console.log(`[OpenAI] Image paths: ${JSON.stringify(imagePaths)}`);
      
      // Prepare the images for the API request
      console.log('[OpenAI] Converting images to base64 format');
      const imageContents = imagePaths.map((path, index) => {
        console.log(`[OpenAI] Processing image ${index + 1}/${imagePaths.length}: ${path}`);
        // Read image as base64
        const buffer = fs.readFileSync(path);
        console.log(`[OpenAI] Image ${index + 1} size: ${buffer.length} bytes`);
        const base64Image = buffer.toString('base64');
        console.log(`[OpenAI] Image ${index + 1} converted to base64`);
        return {
          type: "input_image",
          image_url: `data:image/jpeg;base64,${base64Image}`
        };
      });

      // Define prompt and expected output format
      console.log('[OpenAI] Preparing prompt for OpenAI API');
      const prompt = `
      Extract the complete menu information from these restaurant menu images.
      Format the response as a valid JSON object exactly in the following structure, with no additional text or explanations:
      {
        "restaurant_name": "Name of the restaurant",
        "menu": [
          {
            "category": "Category name (e.g., Appetizers, Main Course, etc.)",
            "items": [
              {
                "id": unique_number,
                "name": "Item name",
                "description": "Item description",
                "price": price_as_number,
                "is_vegetarian": boolean_value,
                "image_url": null
              }
            ]
          }
        ]
      }
      
      Ensure that:
      1. All text visible in the menu is captured
      2. Items are grouped by their correct categories
      3. Prices are converted to numbers (not strings)
      4. Vegetarian items are marked appropriately based on description or symbols in the menu
      5. Each item has a unique ID
      6. The result must be SYNTACTICALLY VALID JSON with ALL FIELD NAMES IN DOUBLE QUOTES
      7. The price field must always be a number, not a string
      8. The is_vegetarian field must always be a boolean (true/false), not a string
      `;

      // API call to OpenAI using the responses API
      console.log('[OpenAI] Making API request to OpenAI Vision model');
      console.time('[OpenAI] API request duration');
      const response = await openai.responses.create({
        model: "gpt-4-turbo", // Updated to use the current model
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            ...imageContents
          ]
        }]
      });
      console.timeEnd('[OpenAI] API request duration');
      console.log('[OpenAI] Received response from OpenAI API');

      // Parse and return the extracted data
      console.log('[OpenAI] Processing API response');
      const content = response.output_text;
      console.log('[OpenAI] Response content length:', content.length);
      
      // Find JSON in the response (in case there's additional text)
      console.log('[OpenAI] Extracting JSON from response');
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        console.log('[OpenAI] JSON string extracted, validating format');
        
        // Validate the JSON
        const validation = validateMenuJSON(jsonStr);
        
        if (validation.isValid) {
          console.log('[OpenAI] Valid JSON format detected and validated');
          console.log(`[OpenAI] Extracted menu for restaurant: "${validation.data.restaurant_name}" with ${validation.data.menu?.length || 0} categories`);
          
          // Log menu structure summary
          if (validation.data.menu && validation.data.menu.length > 0) {
            validation.data.menu.forEach((category, idx) => {
              console.log(`[OpenAI] Category ${idx + 1}: "${category.category}" with ${category.items?.length || 0} items`);
            });
          }
          
          return validation.data;
        } else {
          // If JSON is invalid, throw an error to trigger retry
          console.error(`[OpenAI] JSON validation failed: ${validation.error}`);
          console.error('[OpenAI] Invalid JSON structure:', jsonStr);
          lastError = new Error(`Invalid JSON structure: ${validation.error}`);
          retryCount++;
          console.log(`[OpenAI] Retrying... (${retryCount}/${MAX_RETRIES})`);
        }
      } else {
        console.error('[OpenAI] Failed to extract JSON from response');
        console.error('[OpenAI] Response content:', content);
        lastError = new Error('Failed to extract JSON from OpenAI response');
        retryCount++;
        console.log(`[OpenAI] Retrying... (${retryCount}/${MAX_RETRIES})`);
      }
    } catch (error) {
      console.error(`[OpenAI] Error in attempt ${retryCount + 1}:`, error);
      lastError = error;
      retryCount++;
      
      if (retryCount < MAX_RETRIES) {
        console.log(`[OpenAI] Retrying... (${retryCount}/${MAX_RETRIES})`);
      }
    }
  }
  
  // If all retries failed, throw the last error
  console.error(`[OpenAI] All ${MAX_RETRIES} attempts failed`);
  throw lastError || new Error('Failed to extract menu after multiple attempts');
};

export default { extractMenuFromImages }; 