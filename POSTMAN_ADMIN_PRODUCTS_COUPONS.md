# Postman Testing Guide — Admin Products & Coupons

**Base URL:** `http://localhost:5000/api`

## 1. Prerequisites (Admin Authentication)
Every request below requires a Bearer token obtained from an admin account.

1. **Login as admin**
   - **Method:** `POST`
   - **URL:** `{{base_url}}/auth/login`
   - **Body:**  
     ```json
     {
       "email": "admin@example.com",
       "password": "password123"
     }
     ```
   - **Action:** copy the `token` value from the response.
   - **Subsequent requests:** set `Authorization: Bearer <token>` header.

## 2. Admin Product Management

1. **Create an admin product**
   - **Method:** `POST`
   - **URL:** `{{base_url}}/admin/products`
   - **Body:**
     ```json
     {
       "brandId": "INSERT_ADMIN_BRAND_ID_HERE",
       "name": "Admin Exclusive Headphone",
       "variant": "Matte Black",
       "category": "Electronics",
       "description": "High fidelity noise cancelling headphones.",
       "packSize": "1",
       "warranty": "2 Years",
       "imageUrl": "https://example.com/images/headphone.jpg",
       "bannerUrl": "https://example.com/images/banner.jpg"
     }
     ```

2. **Get admin-created products**
   - **Method:** `GET`
   - **URL:** `{{base_url}}/admin/products`
   - **Query param:** `type=admin`

3. **Get vendor-created products**
   - **Method:** `GET`
   - **URL:** `{{base_url}}/admin/products`
   - **Query param:** `type=vendor`

4. **Update product**
   - **Method:** `PUT`
   - **URL:** `{{base_url}}/admin/products/:id`
   - **Body:**
     ```json
     {
       "name": "Updated Headphone Name",
       "description": "Updated description text."
     }
     ```

5. **Delete product**
   - **Method:** `DELETE`
   - **URL:** `{{base_url}}/admin/products/:id`

## 3. Coupon Management

1. **Create a coupon**
   - **Method:** `POST`
   - **URL:** `{{base_url}}/admin/coupons`
   - **Body:**
     ```json
     {
       "code": "SUMMER2025",
       "description": "Extra 20% off on Amazon Summer Sale",
       "discountType": "percentage",
       "discountValue": 20,
       "expiryDate": "2025-06-30T23:59:59Z",
       "platform": "Amazon",
       "url": "https://amazon.com/summer-sale",
       "imageUrl": "https://example.com/coupon.png"
     }
     ```

2. **List coupons**
   - **Method:** `GET`
   - **URL:** `{{base_url}}/admin/coupons`
   - **Optional query param:** `platform=Amazon`

3. **Coupon details**
   - **Method:** `GET`
   - **URL:** `{{base_url}}/admin/coupons/:id`

4. **Delete a coupon**
   - **Method:** `DELETE`
   - **URL:** `{{base_url}}/admin/coupons/:id`

## 4. Brand & Campaign Filtering

1. **Admin Brands**
   - **Method:** `GET`
   - **URL:** `{{base_url}}/admin/brands`
   - **Query param:** `type=admin`

2. **Vendor Brands**
   - **Method:** `GET`
   - **URL:** `{{base_url}}/admin/brands`
   - **Query param:** `type=vendor`

---

> **Tip**: Use the same Bearer token for all admin routes. If you seed a local admin (`scripts/seed-admin.cjs`), you can re-run it (or manually create the `User`/`Vendor`) and then log in again to keep testing.
