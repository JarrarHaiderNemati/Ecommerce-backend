MangoMerce – E-commerce Platform 

Live Link: [https://mangomerce.netlify.app]

📋 Description:
MangoMerce is a full-stack e-commerce platform featuring two dashboards:

- 🧑‍💼 Cashier Dashboard:  
  Add, edit, and manage products, photos, discounts, and stock.  
  At checkout, enter cash received and get the exact amount of change to return — mimicking real in-store POS systems.

- 👥 Customer Dashboard:  
  Browse items, manage cart with quantities, and give feedback after a simulated purchase (no payment integration).

Built entirely with the MERN stack, it's great for shops, mini-markets, or as a freelance project.

---

🚀 Features

🔐 Auth
- Role-based login/signup (Cashier & Customer)
- Max 'x' number of cashiers allowed , where x=3 in my case in the variable declared inside server.js

🧑‍💼 Cashier Dashboard
- Add / Edit / Delete items
- Upload / remove product images
- Apply / remove discounts
- Increase / decrease stock
- Group items by category
- See feedback by users
- Real-time stock reflection
- Responsive UI

👥 Customer Dashboard
- Add to cart by category
- Increase / decrease item quantity
- View total price
- Submit feedback (1–5 stars)
- Feedback grouped by rating
- View own cart history

---

🛠️ Tech Stack
- Frontend: React, Tailwind CSS, React Router
- Backend: Node.js, Express.js
- Database: MongoDB (via Mongoose)
- Other Tools: Multer for image uploads

---

⚙️ How to Run Locally

1. Clone the repo (both frontend repo and backend repo)

FRONTEND:
```bash

git clone https://github.com/JarrarHaiderNemati/Ecommerce-frontend.git
cd Ecommerce-frontend
npm install
npm start

BACKEND:
```bash

git clone https://github.com/JarrarHaiderNemati/Ecommerce-backend.git
cd Ecommerce-backend
npm install
node server.js

2.Create a '.env' file in the 'BackendDeployment' root folder with the following:

.env
MONGO_URI=your_mongodb_connection_string

3.Then in config.js 

require('dotenv').config();

module.exports = {
  MONGO_URI: process.env.MONGO_URI
};

(You can get a MONGO_URI by signing up in MONGO_DB , creating a project and then a cluster , then adding a user , after that you will be given MONGO_URI)

* IMP NOTE * : If you aim to push this project in GitHub , then in .gitignore file you must write .env , or else anyone can access your MONGO_DB URI and manipulate data

3.Your data models (schemas) should be located in the models/ directory (currently my schemas are present there)

4.Inside server.js (in BackendDeployment folder) , remove the variable 'liveFrontendLink' because you will be testing locally.

5.Inside all js files (in Frontend/src/components folder) , replace the value of variable 'backendLink' with "http://localhost:5000" because you will be testing locally.

📦 License:
Free for personal, educational, or freelance usage. Attribution appreciated!
