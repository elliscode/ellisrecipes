openapi: 3.0.3
info:
  title: Ellis Bake Shop
  description: This is the swagger definition for ellisbakeshop.com api
  version: 0.0.1
paths:
  /order:
    post:
      summary: submit an order to ellisbakeshop.com
      operationId: submitOrder
      requestBody:
        description: Create a new pet in the store
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Order'
        required: true
      responses:
        '200':
          description: Successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Response'          
        '405':
          description: Invalid input
        '500':
          description: server error
components:
  schemas:
    Order:
      type: object
      properties:
        phone:
          type: string
          example: 5551234567
        email:
          type: string
          format: email
        date:
          type: string
          format: date-time
        order:
          type: string
          example: approved
    Response:
      type: object
      properties:
        status:
          type: string
          description: status of order submission
          example: success
          enum:
            - success
            - failed