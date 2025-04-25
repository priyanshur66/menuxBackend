# Menu-X: Restaurant Menu Extraction API

An Express.js backend application that extracts menu details from restaurant menu images using OpenAI's Vision API and provides CRUD operations for menu management.

## Features

- **Menu Extraction**: Upload restaurant menu images and get structured menu data
- **Data Format**: Returns menu information in a standardized JSON format
- **CRUD Operations**: Create, read, update and delete restaurant menus
- **Image Upload**: Support for multiple image uploads with validation
- **User Authentication**: Secure registration and login system
- **Restaurant Ownership**: Restaurant ownership verification for menu operations
- **Role-Based Access**: Different permissions for restaurant owners and admins

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
   JWT_SECRET=your-jwt-secret-key
   JWT_EXPIRE=30d
   JWT_COOKIE_EXPIRE=30
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Docker Setup

1. Make sure you have Docker and Docker Compose installed on your machine.

2. Build and start the containers:
   ```bash
   docker-compose up -d
   ```
   
   Or use the provided script:
   ```bash
   chmod +x docker.sh
   ./docker.sh up
   ```

3. The application will be available at http://localhost:3000

4. To stop the containers:
   ```bash
   docker-compose down
   ```
   
   Or use the provided script:
   ```bash
   ./docker.sh down
   ```

5. Other useful Docker commands:
   - View logs: `./docker.sh logs`
   - Access shell: `./docker.sh shell`
   - Restart containers: `./docker.sh restart`

## API Endpoints

### Authentication

- **POST /api/auth/register**: Register a new user
  - Body: JSON with `name`, `email`, `password`, and optional `restaurants` array
  - Returns: User data and JWT token

- **POST /api/auth/login**: Login user
  - Body: JSON with `email` and `password`
  - Returns: User data and JWT token

- **GET /api/auth/me**: Get current user profile
  - Headers: Authorization: Bearer [token]
  - Returns: User data

- **PUT /api/auth/updatedetails**: Update user details
  - Headers: Authorization: Bearer [token]
  - Body: JSON with `name` and/or `email`
  - Returns: Updated user data

- **POST /api/auth/logout**: Logout user
  - Headers: Authorization: Bearer [token]
  - Returns: Success message

- **POST /api/auth/restaurants**: Add a restaurant to user's list
  - Headers: Authorization: Bearer [token]
  - Body: JSON with `name`, and optional `description` and `location`
  - Returns: Updated list of user's restaurants

- **GET /api/auth/restaurants**: Get all user's restaurants
  - Headers: Authorization: Bearer [token]
  - Returns: List of user's restaurants

### Menus

- **POST /api/menus**: Create new menu from images
  - Headers: Authorization: Bearer [token]
  - Body: Form-data with:
    - `images[]` (multiple files): Menu images to extract data from
    - `restaurant_name` (string): Name of the restaurant (must be owned by the user)

- **GET /api/menus**: Get all menus
  - Headers: Authorization: Bearer [token]
  - Returns: Array of all menus owned by the requesting user (admins see all menus)

- **GET /api/menus/:id**: Get menu by ID
  - Headers: Authorization: Bearer [token]
  - Returns: Single menu object if owned by the requesting user (admins can access any menu)

- **PUT /api/menus/:id**: Update menu data
  - Headers: Authorization: Bearer [token]
  - Body: JSON with menu data to update
  - Note: User must own the restaurant associated with this menu

- **PUT /api/menus/:id/images**: Update menu with new images
  - Headers: Authorization: Bearer [token]
  - Body: Form-data with:
    - `images[]` (multiple files): Menu images to extract data from
    - `restaurant_name` (optional string): Name of the restaurant (must be owned by the user)
  - Note: User must own the restaurant associated with this menu

- **DELETE /api/menus/:id**: Delete menu
  - Headers: Authorization: Bearer [token]
  - Returns: Success message
  - Note: User must own the restaurant associated with this menu

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