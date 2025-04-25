import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extracts menu information from images using OpenAI's Vision API
 * @param {Array<String>} imagePaths - Array of image file paths
 * @returns {Promise<Object>} Extracted menu data in the required format
 */
export const extractMenuFromImages = async (imagePaths) => {
  try {
    console.log(`[OpenAI] Starting menu extraction process with ${imagePaths.length} images`);
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
    Format the response as a JSON object with the following structure:
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
      console.log('[OpenAI] Valid JSON format detected in response');
      const extractedJson = JSON.parse(jsonMatch[0]);
      console.log('[OpenAI] Successfully parsed JSON data');
      console.log(`[OpenAI] Extracted menu for restaurant: "${extractedJson.restaurant_name}" with ${extractedJson.menu?.length || 0} categories`);
      
      // Log menu structure summary
      if (extractedJson.menu && extractedJson.menu.length > 0) {
        extractedJson.menu.forEach((category, idx) => {
          console.log(`[OpenAI] Category ${idx + 1}: "${category.category}" with ${category.items?.length || 0} items`);
        });
      }
      
      return extractedJson;
    } else {
      console.error('[OpenAI] Failed to extract valid JSON from response');
      console.error('[OpenAI] Response content:', content);
      throw new Error('Failed to extract valid JSON from OpenAI response');
    }
  } catch (error) {
    console.error('[OpenAI] Error extracting menu from images:', error);
    throw error;
  }
};

export default { extractMenuFromImages }; 