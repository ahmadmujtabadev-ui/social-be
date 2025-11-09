# Canvastry-WholeSale

**Canvastry-WholeSale** is a modern wholesale management platform built to streamline **bulk product ordering, inventory tracking, customer management, and sales analytics**.  
It’s designed for distributors, wholesalers, and suppliers to manage operations efficiently with an intuitive dashboard and powerful automation.

## 📌 Features

- 🏗 **Express.js** for API routing
- 🗄 **MongoDB with Mongoose** for database management
- 🔐 **JWT Authentication** with `jsonwebtoken`
- ✅ **Validation** using `joi` and `express-validator`
- 📩 **Email handling** with `nodemailer`
- 🛠 **Code linting & formatting** with ESLint and Prettier
- 🔄 **Auto-reload** using Nodemon
- 🔧 **Pre-commit hooks** with Husky

---

## 📦 Installation

Make sure you have **Node.js** and **pnpm** installed.

```sh
pnpm install
```

---

## 🚀 Usage

### Start the development server:

```sh
pnpm start
```

### Lint code:

```sh
pnpm lint
```

### Format code:

```sh
pnpm format
```

---

## 📂 Project Structure

```
BoilerPlate-Express-MongoDB/
│── src/
│   ├── routes/        # API routes
│   ├── controllers/   # Business logic
│   ├── models/        # Mongoose models
│   ├── middleware/    # Authentication, validation, etc.
│   ├── utils/         # Helper functions
│   ├── index.js       # Entry point
│── .env               # Environment variables
│── .eslintrc.js       # ESLint configuration
│── .prettierrc        # Prettier configuration
│── package.json       # Dependencies & scripts
│── README.md          # Documentation
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory and add the following:

```env
PORT=5000
NODE_ENV=Production
CONNECTION_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_TTL=
JWT_REFRESH_TTL=
```

---

## 🛠 Dependencies

### **Main Dependencies**

- `express` – Web framework
- `mongoose` – MongoDB ORM
- `dotenv` – Environment variables
- `jsonwebtoken` – JWT authentication
- `bcrypt` – Password hashing
- `nodemailer` – Email sending
- `Joi` – Request validation

### **Dev Dependencies**

- `eslint` – Linting
- `prettier` – Code formatting
- `husky` – Git hooks
- `nodemon` – Auto-restart on file changes

---

## 🤝 Contributing

1. **Fork** this repository.
2. **Clone** your forked repository:
   ```sh
   git clone https://github.com/your-username/BoilerPlate-Express-MongoDB.git
   ```
3. **Create a branch** for your feature:
   ```sh
   git checkout -b feature-name
   ```
4. **Make your changes** and commit:
   ```sh
   git commit -m "Added new feature"
   ```
5. **Push to GitHub** and create a Pull Request.

---

## 📜 License

This project is licensed under the **ISC License**.

---

### 📧 Need Help?

Feel free to open an **Issue** or reach out for support! 🚀
Authors
 [ranasubhandev](https://github.com/Subhankhalid1/)

---

This **README.md** follows best practices, is well-structured, and ensures a professional look. You can format it in **VS Code** by pressing `Shift + Alt + F` (Windows/Linux) or `Shift + Option + F` (Mac). 🚀 Let me know if you need any modifications!
