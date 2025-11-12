const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Grocery Share API',
      version: '2.0.0',
      description: 'A peer-to-peer grocery sharing platform API with JWT authentication, geospatial search, notifications, chat, and AI-powered recommendations',
      contact: {
        name: 'Grocery Share Team',
        email: 'support@groceryshare.com'
      }
    },
    servers: [
      {
        url: process.env.RENDER_EXTERNAL_URL || 'https://grocery-share-backend.onrender.com',
        description: 'Production server'
      },
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: <your-token>'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    path.join(__dirname, '..', 'routes', '*.js'),
    path.join(__dirname, '..', 'controllers', '*.js')
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
