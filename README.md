# Menu-X: Restaurant Menu Extraction API

An Express.js backend application that extracts menu details from restaurant menu images using OpenAI's Vision API and provides CRUD operations for menu management.

## Features

- **Menu Extraction**: Upload restaurant menu images and get structured menu data
- **Data Format**: Returns menu information in a standardized JSON format
- **CRUD Operations**: Create, read, update and delete restaurant menus
- **Image Upload**: Support for multiple image uploads with validation

## Tech Stack

- **Node.js & Express**: Server and API framework
- **MongoDB & Mongoose**: Database and ODM
- **OpenAI API**: GPT-4 Vision for menu text extraction
- **Multer**: File upload handling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas connection)
- OpenAI API key

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd menu-x
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/menu-x
   OPENAI_API_KEY=your_openai_api_key_here
   NODE_ENV=development
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Menus

- **POST /api/menus**: Create new menu from images
  - Body: Form-data with:
    - `images[]` (multiple files): Menu images to extract data from
    - `restaurant_name` (optional string): Name of the restaurant to override the extracted name

- **GET /api/menus**: Get all menus
  - Returns: Array of all menu objects

- **GET /api/menus/:id**: Get menu by ID
  - Returns: Single menu object

- **PUT /api/menus/:id**: Update menu data
  - Body: JSON with menu data to update

- **PUT /api/menus/:id/images**: Update menu with new images
  - Body: Form-data with:
    - `images[]` (multiple files): Menu images to extract data from
    - `restaurant_name` (optional string): Name of the restaurant to override the extracted name

- **DELETE /api/menus/:id**: Delete menu
  - Returns: Success message

## Example Menu Data Format

```json
{
  "restaurant_name": "Tasty Bites",
  "menu": [
    {
      "category": "Appetizers",
      "items": [
        {
          "id": 1,
          "name": "Spring Rolls",
          "description": "Crispy rolls stuffed with vegetables",
          "price": 5.99,
          "is_vegetarian": true,
          "image_url": "https://example.com/spring_rolls.jpg"
        }
      ]
    },
    {
      "category": "Main Course",
      "items": [
        {
          "id": 10,
          "name": "Grilled Salmon",
          "description": "Salmon fillet with lemon butter sauce",
          "price": 15.99,
          "is_vegetarian": false,
          "image_url": "https://example.com/grilled_salmon.jpg"
        }
      ]
    }
  ]
}
```

## License

MIT 