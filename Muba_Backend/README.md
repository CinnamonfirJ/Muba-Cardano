# BACKEND API FOR MUBAXPRESS

This backend provides the core API for SEG, designed to handle `POST`, `GET`, `PATCH`, and `DELETE` request for the MUBAXPRESS application

---

## TABLE OF CONTENTS

- [OVERVIEW](#overview)
- [FEATURES](#features)
- [ROUTES/API ENDPOINTS](#routesapi-endpoints)
  - [AUTH](#auth)
  - [USERS](#users)
  - [VENDORS](#vendors)
  - [STORES](#stores)
  - [PRODUCTS](#products)

---

## OVERVIEW

- Base URL: `https://muba-backend.onrender.com`
- Status: Development
- **Auth Required**: None
- Format: JSON requests and response

---

## ROUTES/API ENDPOINTS

### AUTH

#### POST &nbsp;&nbsp;&nbsp;&nbsp; /api/v1/auth/sign-up

- **Auth Required**: None
- **Description**: Register a user
- **Response**:

#### POST &nbsp;&nbsp;&nbsp;&nbsp; /api/v1/auth/sign-in

- **Auth Required**: None
- **Description**: Log the user in. This route creates two tokens, the `reset_token`, which is used to log the user in, and the `access_token`, which is used to access the `refresh_token`. The `refresh_token` expires in 30days from creation time, while the `access_token` expires 15mins from the creation time.
- **Response**:

#### POST &nbsp;&nbsp;&nbsp;&nbsp; /api/v1/auth/signout

- **Auth Required**: None
- **Description**: Log Users Out
- **Response**:

#### POST &nbsp;&nbsp;&nbsp;&nbsp; /api/v1/auth/otp

- **Auth Required**: None
- **Description**: When a user requests otp, a request should be made to this route, for the user to get a 6 digit otp, that would expire in 15mins
- **Response**:

#### POST &nbsp;&nbsp;&nbsp;&nbsp; /api/v1/auth/reset-password

- **Auth Required**: None
- **Description**: When a user inputs the otp he receives, and his new password, a request should be made to this route, to update the database, with the users' new password.

- **Response**:

---

### USERS

---

### VENDORS

#### POST &nbsp;&nbsp;&nbsp;&nbsp; /api/vi/vendors

- **Auth Required**: None
- **Description**: This route is used to request to be a vendor. when the vendor verification form is submitted, a request is sent to this route, to submit the application, then admins get email notification upon successfull submission.

- **Response**:

#### GET &nbsp;&nbsp;&nbsp;&nbsp; /api/vi/vendors

- **Auth Required**: None
- **Description**: This route would return all the [vendors](#vendors) that have been verified in Muba

- **Response**:

#### GET &nbsp;&nbsp;&nbsp;&nbsp; /api/vi/vendors/:\_id

- **Auth Required**: None
- **Description**: This route would return specific vendor details

- **Response**:

#### PATCH &nbsp;&nbsp;&nbsp;&nbsp; /api/vi/vendors/:\_id

- **Auth Required**: Admin Access
- **Description**: This part is used only by the admin to validate vendors, using their specific vendor `_id`.
  When the admins receives a vendor request, check the specific vendor request, and can validate the vendor, after which the vendor status changes, and the vendor receives an email notification on status update.

- **Response**:

---

### STORES

#### POST &nbsp;&nbsp;&nbsp;&nbsp; [/api/v1/stores](https://muba-backend.onrender.com/api/v1/stores)

- **Auth Required**: Role Based
- **Description**: This is a role based route, that is used to create stores. Only Vendors are allowed to create a store. and one vendor can create is at most 5 stores.
- **Response**:

#### GET &nbsp;&nbsp;&nbsp;&nbsp; /api/vi/stores

- **Auth Required**: None
- **Description**: This route would return all the [stores](#stores) that have been created in Muba

- **Response**:

#### GET &nbsp;&nbsp;&nbsp;&nbsp; /api/vi/stores/:\_id

- **Auth Required**: None
- **Description**: This part is used to get specific store either by the store `_id` passed to the request params
- **Response**:

#### PATCH &nbsp;&nbsp;&nbsp;&nbsp; /api/vi/stores/:\_id

- **Auth Required**: `refresh_token` and `access_token` to verify that the user is logged in. please refer back to [auth routes](#auth) to understand how they work together.

- **Description**: This part is used to edit or change specific store information or details by the store `_id` passed to the request params.
  The edited information would be received in the request body, and the `_id` from the params would be used to find the store, and if found, the store details would be updated, and the vendor would be notified via email.

- **Response**:
  - Success:
  - Error:

#### DELETE &nbsp;&nbsp;&nbsp;&nbsp; /api/vi/stores/:\_id

- **Auth Required**: `refresh_token` and `access_token` to verify that the user is logged in. please refer back to [auth routes](#auth) to understand how they work together.

- **Description**: This part is used to delete specific store by the store `_id` passed to the request params.
  The selected store, gets deleted immidiately, and is removed from the database

- **Response**:

#### GET &nbsp;&nbsp;&nbsp;&nbsp; /api/vi/stores/search

- **Auth Required**: None

- **Description**: This part is used to search specific store either by the store `name`, or filter by `location`, passed to the request body.

- **Response**:

---

### PRODUCTS

#### POST &nbsp;&nbsp;&nbsp;&nbsp; [/api/v1/products](https://muba-backend.onrender.com/api/v1/products)

- **Auth Required**: Role Based Access for only Vendors

- **Description**: This is a role based route, that is used to create products. Only Vendors are allowed to create a product.

- **Response**:

#### GET &nbsp;&nbsp;&nbsp;&nbsp; /api/vi/products

- **Auth Required**: None
- **Description**: This route would return all the [products](#products) that have been created in Muba

- **Response**:

#### GET &nbsp;&nbsp;&nbsp;&nbsp; /api/vi/products/:\_id

- **Auth Required**: None
- **Description**: This part is used to get specific product either by the product `_id` passed to the request params
- **Response**:

#### PATCH &nbsp;&nbsp;&nbsp;&nbsp; /api/vi/products/:\_id

- **Auth Required**: `refresh_token` and `access_token` to verify that the user is logged in. please refer back to [auth routes](#auth) to understand how they work together.

- **Description**: This part is used to edit or change specific product information or details by the product `_id` passed to the request params.
  The edited information would be received in the request body, and the `_id` from the params would be used to find the product, and if found, the product is looked into, to confirm that the logged-in user, is the actual owner of the product, before the product details would be updated.

- **Response**:
  -- Success:
  -- Error:

#### DELETE &nbsp;&nbsp;&nbsp;&nbsp; /api/vi/products/:\_id

- **Auth Required**: `refresh_token` and `access_token` to verify that the user is logged in. please refer back to [auth routes](#auth) to understand how they work together.

- **Description**: This part is used to delete specific product by the product `_id` passed to the request params, which would be used to find the product, and if found, it'll check if the logged-in user, is the actual owner of the product to be deleted, then the selected product, gets deleted immidiately, and is removed from the database.

- **Response**:

#### GET &nbsp;&nbsp;&nbsp;&nbsp; /api/vi/products/search

- **Auth Required**: None

- **Description**: This part is used to search specific product either by the product `name`, or filter by `category`, or `price`(min or max price) passed to the request body.

- **Response**:

---

## AUTHOR

- David, David

---

## CONTACTS

- X: [@blacdav](https://x.com/blacdav)
