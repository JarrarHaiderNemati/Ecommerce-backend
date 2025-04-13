require("./database"); // This ensures database.js runs and connects
const express = require("express");
const bcryptjs=require('bcryptjs');
const cors=require('cors');
const multer=require('multer');
const app = express();
const fs=require('fs');
const path=require('path');

app.use(cors({
  origin: [
    "http://localhost:3000",                   // for local testing
    "https://mangomerce.netlify.app"           // live frontend
  ],
  credentials: true
}));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage=multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname); // create a unique filename
  }
});

const upload=multer({storage:storage});

const PORT = 5000;
const User = require("./models/Users.js");
const Product=require('./models/Products.js');
const Cart=require('./models/Cart.js');
const History=require('./models/History.js');
const Discount=require('./models/Discount.js');
const Feedback=require('./models/Feedback.js');
const threshold=5; // For more feedbacks option
const cashiersAllowed = 3; //Max numbers of cashiers allowed

app.use(express.json());

app.post('/uploadPhoto',upload.single('photo'),(req,res)=>{ //Upload photo endpoint
  console.log('Inside /uploadPhoto');
  if(!req.file) {
    console.log('File is missing ! ');
    return res.status(500).json({ message: 'No file uploaded!' });
  }
  const filePath=`/uploads/${req.file.filename}`; //Build the file path
  return res.status(200).json({link:filePath}); //Return the filepath
});

app.delete('/deletePhoto',async (req,res)=>{ //Remove photo endpoint
  console.log('Inside /deletePhoto ! ');
  const {name}=req.body;
  if(!name) {
    console.log('Name is missing ! ');
    return res.status(500).json({ message: 'Name is missing as a parameter!' });
  }
  try{
  console.log('Inside try block of /deletePhoto ! ');
  const findItem=await Product.findOne({ //Find the item 
    name
  });
  if(findItem) {
    console.log('Item found ! Remvoing photo and deleting the pic from the folder ! ');
    const fileName=path.basename(findItem.photo); //Get the filename only
    const filePath=path.join(__dirname,'uploads',fileName); //Build the full path to file

    if(fs.existsSync(filePath)) { //Check if file exists
      fs.unlinkSync(filePath); //Delete the file
      console.log('Photo file deleted from uploads folder');
    }
    else {
      console.log('Photo file not found in uploads folder');
    }
    //Remove the photo from DB

    findItem.photo=null;
    await findItem.save();
    return res.status(200).json({message:'Photo removed successfully ! '});
  } 
}
catch(err) {
  console.log('Inside catch block of /deletePhoto ! ',err);
  return res.status(500).json({message:'Some error occured ! '});
}
});

app.put('/updatePhoto',async(req,res)=>{ //Giving a photo to an item with no photo and item is already added in store
  console.log('Inside /updatePhoto ! ');
  const {name,photoLink}=req.body;
  if(!name) {
    console.log('Name is missing ! ');
    return res.status(500).json({message:'Name is misisng ! '});
  }
  try{
    console.log('Inside try block of /updatePhoto ! ');
  const findItem=await Product.findOne({ //find the item with the name
    name
  });

  if(findItem) { //If item exists then update the photo from null to the photoLink sent from frontend
    findItem.photo=photoLink;
    await findItem.save();
    return res.status(200).json({message:'Photo added successfully ! '});
  }
  return res.status(400).json({message:'Photo not added successfully ! '});
}
catch(err) {
  console.log('Inside catch block of /updatePhoto ! ');
  return res.status(500).json({message:'Some error occured ! '});
}
});

app.post("/login", async (req, res) => { //Login endpoint
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ message: "Please enter all fields!" });
  }
  try {
    const findUsers = await User.findOne({ email });

    if (!findUsers) {
      return res.status(400).json({ message: "Record not found!" });
    }

    if (findUsers.role !== role) {
      return res.status(400).json({ message: "Wrong role!" });
    }
    const isMatch=await bcryptjs.compare(password,findUsers.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }
    return res.status(200).json({ message: "Successful!" });
  } catch (err) {
    console.log("Error encountered!");
    return res.status(500).json({ message: "Error encountered with DB!" });
  }
});

app.post("/signup", async (req, res) => { //Signup endpoint
  const { email, name, password, role } = req.body;
  if (!email || !password || !role || !name) {
    return res.status(400).json({ message: "Please enter all fields!" });
  }

  try {
    const findUsers = await User.find({ role });
    if (role === "Cashier" && findUsers.length >= cashiersAllowed) {
      return res.status(200).json([]);
    } else {

      const salt=await bcryptjs.genSalt(10);
      const hashedPassword=await bcryptjs.hash(password,salt);
      const insertUser = new User({
        email,
        name,
        password:hashedPassword,
        role
      });
      await insertUser.save();
      return res.status(200).json(insertUser);
    }
  } catch (err) {
    console.error("Error occurred");
    return res.status(500).json({ message: "Some error occurred!" });
  }
});

app.post('/name',async (req,res)=>{ //Fecth name of cashier or customer
  const {email,role}=req.body;

  if(!email||!role) {
    return res.status(500).json({mesage:'Both fields are required ! '});
  }

  try{
  const nameOfUser=await User.findOne({
    email,role
  });

  if(nameOfUser) {
    return res.status(200).json(nameOfUser.name);
  }
  return res.status(404).json({message:'Record not found ! '});
  }
  catch(err) {
    console.error('Some error occured fetching name ! ');
    return res.status(500).json({message:'Some error occured fetching name ! '});
  }
});

app.post('/addItem',async (req,res)=>{ //Add item to store
  const {name,stock,price,category,photo}=req.body;
  
  if(!name||!category||!stock||!price||!photo) {
    return res.status(500).json({message:'All fields are required ! '});
  }

  try {
  const findItem=await Product.findOne({
    name
  });
  
  if(findItem) {
    return res.status(200).json([]);
  }
  const newItem=new Product({
    name,
    category,
    stock,
    price,
    photo
  });

  await newItem.save();
  return res.status(200).json(newItem); 
}
catch(err) {
  console.error('Some error occured !' );
  return res.status(500).json({message:'Some error occured ! '});
}

});

app.get('/fetchItems',async (req,res)=>{ //Fetch items from store
  try{
    const findItems=await Product.find({});
    if(findItems.length>0) {
      const groupedProducts={}; //Group by category

      for(const prod of findItems) {
        const {name,category,price,stock,photo}=prod;

        if(!groupedProducts[category]) {
          groupedProducts[category]={
            category:category,
            items:[]
          };
        }

        groupedProducts[category].items.push({
          name:name,
          price:price,
          stock:stock,
          photo:photo
        });
      }
      return res.status(200).json(Object.values( groupedProducts));
    }
    return res.status(200).json([]);
  }
  catch(err) {
    return res.status(500).json({message:'Some error occured ! '});
  }
});


app.get('/searchItems',async(req,res)=>{ //Search items from cashier dashbaord
  console.log('Inside searchItems backend API ! ');
  const {name}=req.query;
  
  if(!name) {
    console.log('Inside ! name of searchItem endpoint , value of name is ',name);
    return res.status(500).json({message:'Name is required ! '});
  }
  try{
    console.log('Inside try block of searchItems endpoint ! ');
    const searchResult=await Product.find({
      name: { $regex: `^${name}`, $options: "i" },
    });
    console.log('Item search complete ! ');
    const groupedProduct={}; //Returns search results grouped by category
    if(searchResult.length>0) {
      console.log('Length > 0 , about to group items ! ');
      for (const prod of searchResult) {
        const {name,category,stock,price,photo}=prod;
        if(!groupedProduct[category]) {
          groupedProduct[category]={
            category:category,
            items:[]
          };
        }
        groupedProduct[category].items.push({
          name:name,
          price:price,
          stock:stock,
          photo:photo
        });
      }
      console.log('Grouped items ! ');
      return res.status(200).json(Object.values(groupedProduct));
    }
    console.log('No item with this name exists , returning an empty object ! ');
    return res.status(404).json({message:'No such item exists'});
  } 
  catch(err) {
    console.log('Some error occured inside try block of searchItems endpoint ! ');
    return res.status(500).json({message:'Some error occured ! ',err});
  }
});

app.put('/addStock',async(req,res)=>{ //Increment stock of item in store
  const {name}=req.body;
  
  try{
    const findItem=await Product.findOne({
      name
    });
    if(findItem) {
      findItem.stock++;
      await findItem.save();
      return res.status(200).json({message:'Success ! '});
    }
      return res.status(400).json({message:'Item not found ! '});
  }
  catch(err) {
    return res.status(500).json({message:'Some error occured ! '});
  }
}); 

app.put('/removeStock',async(req,res)=>{ //Decrement stock of item in store
  const {name}=req.body;
  try{
  const findItem=await Product.findOne({
    name
  });
  if(findItem) {
      findItem.stock--;
      await findItem.save();
      return res.status(200).json(findItem.stock);
  }
  else {
    return res.status(404).json({message:'Item not found ! '});
  }
}
catch(err) {
  return res.status(500).json({message:'Some error occured ! '});
}
});

app.delete('/deleteItem',async(req,res)=>{ //Delete item from store
  const {name}=req.query;
  try{
    const removeItem=await Product.findOneAndDelete({
      name
    });
    if(!removeItem) {
      return res.status(404).json({message:'Item not deleted ! '});
    }
    return res.status(200).json({message:'Success ! '});

  }
  catch(err) {
    return res.status(500).json({message:'Some error occured ! '});
  }
});

app.put('/editItems',async(req,res)=>{ //Edit item endpoint
  const {name,newName}=req.body;
  
  try{
  const fetchItem=await Product.findOne({
    name
  });
  
  if(fetchItem) {
    fetchItem.name=newName;
    await fetchItem.save();
    return res.status(200).json({message:'Success ! '});
  }
}
catch(err) {
   return res.status(500).json({message:'Some error occured ! '});
}
  
});

app.get('/getCart',async (req,res)=>{
  const {name,detail}=req.query;

  if(detail==='simple') {
  try{
    const findItem=await Product.find({
      name: { $regex: `^${name}`, $options: "i" }
    });

    
    if(findItem.length>0) {
      const product={};
      findItem.forEach((item)=>{
        const name=item.name;
        const price=item.price;
        product[name]={name,price};
      })
      return res.status(200).json(Object.values(product));

    }
    
    return res.status(404).json({message:'Item not found in database ! '});
  }
  catch(err) {
    return res.status(500).json({message:'Some error occured ! '});
  }
}
  else if(detail==='cart') {
    try{
      const findItem=await Product.findOne({
        name
      });
      if(findItem) {
        return res.status(200).json(findItem);
      }
      return res.status(404).json({message:'Item not found ! '});
    }
  catch(err) {
    return res.status(500).json({message:'Some error occured ! '});
  }
}
});

app.get('/cusName/:email',async (req,res)=>{ //Return customer names
  const {email}=req.params;
  if(!email) {
    return res.status(500).json({message:'Email is required ! '});
  }
  try{
  const findUser=await User.findOne({
    email
  });

  if(findUser) {
    return res.status(200).json({name:findUser.name});
  }
  return res.status(404).json({message:'User does not exist ! '});
}
  catch(err) {
    return res.status(500).json({message:'Some error occured ! '});
  } 
});

app.get('/getStock',async (req,res)=>{ //Get stocks of items in market
    try{
      const groupedData={};
      const getStock=await Product.find({});
      
      getStock.forEach(element => {
        const {name,stock}=element;
        if(!groupedData[name]) {
          groupedData[name]={
            stock:stock
        }
        }
        else {
            groupedData[name].stock+1;
        }
      });
      return res.status(200).json(groupedData);
    }
    catch(err) {
      return res.status(500).json({message:'Some error occured ! '});
    }
});

app.get('/getUrcart',async (req,res)=>{ //Return items from your cart
  const {email}=req.query;
  if(!email) {
    return res.status(500).json({message:'Email is missing ! '});
  }
  const groupedCarts={}; //name price category quantity
  try{
    const findUser=await Cart.findOne({ //find if user has something in cart
      email
    });
    if(!findUser) { //user has no item
      return res.status(400).json({message:'User has no item in cart ! '});
    }
    const findUserItems=await Cart.find({ //find all items of this user in his cart
      email
    });
    findUserItems.forEach(element => { //loop
      const {name,category,price,quantity,photo}=element; 
        groupedCarts[name]={ //grouping by names ( even though quantity is already handled seperately)
          category,
          name,
          price,
          quantity,
          photo
        } 
    });
    return res.status(200).json(groupedCarts); //return the object
  }
  catch(err) { //some other error occured
    return res.status(500).json({message:'Some error occured ! '});
  }
});

app.put('/restoreItems',async(req,res)=>{ //End point for restroing the original quantity in market when a user clears his cart
  console.log('Inside /restoreItems ! ');
  const {name,quantity}=req.body;
  if(!name||!quantity) {
    console.log('/restoreItems=> Name and quantity both must be present ! ');
    return res.status(500).json({message:'All fields must be present ! '});
  }
  try{
    console.log('Inside try block of /restoreItems ! ');
    const updateStock=await Product.findOneAndUpdate( //Find and update item in market
      {name},
      {$inc:{stock:quantity}}, //Efficient atomic incrment
      {return:true} //Returns the updated document
    );
    if(updateStock) {
      console.log('Stock of item after updating is ',updateStock.stock);
      return res.status(200).json({message:'Stock incremented successfully ! '});
    }
    else {
      console.log('Item not found in market ! ');
      return res.status(404).json({message:'Item not found ! '});
    }
  }
  catch(err) {
    console.log('Inside catch block of /restoreItems ! ');
    return res.status(500).json({message:'Some error occured ! '});
  }
})

app.post('/postUrCart',async (req,res)=>{ //Decrement or incrmeent stock of items in user's cart
  const {email,category,price,name,desc,photo}=req.body;
  if(!email||!category||!price||!name||!photo) {
    console.log('Error due to missing fields ! ',req.body);
    return res.status(500).json({message:'All fields required ! '});
  }

  try{
  const findUser=await Cart.findOne({
    email
  });

  if(desc==='Inc') { //desc==='Inc'
    console.log('Inside inc ! ');
  if(findUser) { //user already exists
    console.log('About to find item ! ');
    const findItem=await Cart.findOne({ //find the item
      name
    });
    if(findItem) { //item already exists , increment quantity
      console.log('Inside findItem ! ');
      findItem.quantity++;
      await findItem.save();
      console.log('INCREMENT SUCCESSFUL ! ');
      return res.status(200).json({message:'Successfully incremented ! '});
    }
    console.log('About to insert new item ! ');
    //Item is being added for first time in the current user's cart
    const insertItem=new Cart({
      name,
      category,
      email,
      price,
      quantity:1,
      photo
    });
    await insertItem.save();
    console.log('INSERTION SUCCESSFUL ! ');
    return res.status(200).json({message:'Item inserted for first time ! '})
  }
  else { //user does not exist 
    console.log('About to add user for first time ! ');
    const insertItem=new Cart({
      name,
      category,
      email,
      price,
      quantity:1,
      photo
    });
    await insertItem.save();
    console.log('1st time INSERTION OF USER SUCCESSFUL ! ');
    return res.status(200).json({message:'Item/User inserted for first time ! '})
  }
}
else { //desc==='Dec'
  const findItem=await Cart.findOne({
    name
  });
  if(findItem.quantity>=1) {
    findItem.quantity--;
    await findItem.save();
    return res.status(200).json({message:'Item quanity decremented ! '});
  }

}
  }
  catch(err) {
    console.log('Error due to not missing fields ! ');
    return res.status(500).json({message:'Some error occured ! '});
  }
});

app.get('/deleteItem',async (req,res)=>{ //Deleting item from cart when quantity in ur cart goes to 0 or when confirmed in Yourcart.js ( by - button)
  const{email,name}=req.query;

  try{
  const findItem=await Cart.findOneAndDelete({ //find the item and delete it along with the email
    email,
    name
  });

  if(findItem) {
    return res.status(200).json({message:'deletion successful'});
  }
  return res.status(400).json({message:'Deletion unsuccessful ! '});
}
catch(err) {
  return res.status(500).json({message:'Some error occured ! '});
}
});

app.post('/clearCart',async (req,res)=>{ //Clear whole cart
  const {email}=req.body;
  //Check if email is retrieved properly
  if(!email) {
    console.log('Inside ! email of clearCart');
    return res.status(500).json({message:'Some issue fetching user email ! '});
  }
  //Email exists
  console.log('OK So ! Email exists , about to go in try block ');
  try{
    const delItem=await Cart.deleteMany({
      email
    });
    if(delItem.deletedCount>0) {
      console.log('User cart deleted successfully ! ');
      return res.status(200).json({message:'Success ! '});
    }
    console.log('Cart not deleted successfully ! ');
    return res.status(404).json({message:'Some error deleting cart ! '});
  }
  catch(err) {
    console.log('Inside catch block of clearCart ! ');
    return res.status(500).json({message:'Some error occured ! '});
  }
});

//Posting cart history / single item of a user
app.post('/cartHistory',async(req,res)=>{
  const {email,itemsArray}=req.body;
  if(!Array.isArray(itemsArray)||itemsArray.length===0||!email) { //Not array or length is 0 or email is missing
    console.log('Either not array or length is 0 or email is missing !');
    return res.status(500).json({message:'Either not array or length is 0 !'});
  }

  try{
    console.log('Inside try block ! ');

  //No issue with array or length
  console.log('About to traverse array and save in backend ! ');
  // Create an array of promises (each one saving an item)
  const insertPromises = itemsArray.map(item => {
    const { name, price, quantity, category } = item;
    const insertItem = new History({ email, name, price, quantity, category });
    console.log('Saving item:', item);
    return insertItem.save(); // Each call returns a promise
  });

  // Wait for all database insertions to complete
  await Promise.all(insertPromises);
  return res.status(200).json({message:'Successfully inserted full cart /single item of user'});
}
catch(err) { 
  console.log('Inside catch block , some error occured in between ! ');
  return res.status(500).json({message:'Some error occured in between ! '});
}
});

//Get cart history
app.get('/usercartHistory',async (req,res)=>{
  console.log('Inside /usercartHistory ! ');
  const {email}=req.query;
  console.log('Email is ',email);
  if(!email) {
    console.log('Email is missing ! ');
    return res.status(500).json({message:'Email is missing ! '});
  }
  try{
    console.log('Inside try block of /usercartHistory')
    const userHistory=await History.find({ //Get all the products bought for a certain user
      email
  });

  if(userHistory.length>0) { //User has bought items from this store before
    console.log('Fetched user history successfully ! ');

    //Logic to start filtering out old items when user histroy gets too big

    //Sort based on time created
    userHistory.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)); //Sort takes a function and sorts based on that
    const threshold=5; //Start filtring out items from array when length of array gets more than threshold

    if(userHistory.length>threshold) {
      console.log('userHistory.length is > threshold , so going inside while loop ! ');
      while(userHistory.length>threshold) { //While the length of array is greater than the threshold , keep removing the first index
        userHistory.shift(); //Shift modifies the array and removes the first index
      }
    }
    return res.status(200).json(userHistory); //Returns the array 
  }
  console.log('User has never bought any item ! ');
  return res.status(404).json({message:'User has never bought any item ! '});
}
catch(err) {
  console.log('Inside catch block of /usercartHistory ! ');
  return res.status(500).json({message:'Some error occured ! '});
}
});

// Add discount
app.post('/addDiscount',async(req,res)=>{
  console.log('Inside add discount API / end pt ! ');
  const {name,category,price,discountPrice}=req.body;
  if(!name||!category||!price||!discountPrice) {
    console.log('ADD DISCOUNT API : Name category , price , discountPrice all are required ! ');
    return res.status(500).json({message:'Both name and category are required ! '});
  }

  try{
    console.log('Inside try block of addDiscounts');
    const insertDiscount=new Discount({
      name,
      category,
      price,
      discountPrice
    });
    await insertDiscount.save();
    console.log('Discount inserted and saved ! ');
    return res.status(200).json({message:'Success ! Inserted discount ! '});
  }
  catch(err) {
    console.log('Inside catch block of addDiscount ! ');
    return res.status(500).json({message:'Some error occured ! '});
  }
});

app.get('/fetchDiscounts',async (req,res)=>{ //Fetch discounted items
  console.log('Inside /fetchdiscounts ');
  try{
    const groupedDiscount={}; //grouping discounts 
    console.log('Inside try block of /fetchDiscounts');
    const fetchDisc=await Discount.find({}); //Retrieve all discounts
    if(fetchDisc.length>0) {
      console.log('Inside if block of /fetchDiscounts , meaning there are discounts present ! ');
      console.log('About to group discounts inside /fetchDiscounts');
      fetchDisc.forEach(element => { //Grouping discounts by name
        const {name,discountPrice}=element
        if(!groupedDiscount[name]) {
          groupedDiscount[name]={
            name:name,
            discountPrice:discountPrice
          }
        }
      });
      console.log('Grouped successfully ! ');
      return res.status(200).json(groupedDiscount);
    }
    else { //No discounts
      console.log('No discounts present ! ');
      return res.status(404).json({message:'No discounts found ! '});
    }
  }
  catch(err) {
    console.log('Some error occured inside try block of /fetchDiscounts ! ');
    return res.status(500).json({message:'Some error occured ! '});
  }
});

app.delete('/removeDiscount',async (req,res)=>{ //Remove discount
  console.log('Inside /removeDiscount');
  const {name}=req.query;
  if(!name) {
    console.log('/removeDiscount=> Name is mandatory !');
    return res.status(500).json({message:'Name is mandatory ! '});
  }
  try{
    console.log('Inside try block of /removeDiscount ! ');
    const deleteDiscount=await Discount.findOneAndDelete({
      name
    });
    if(deleteDiscount) {
      console.log('Discount deleted successfully ! ');
      return res.status(200).json({message:'Discount deleted successfully ! '});   
    }
    console.log('Discount not deleted ! ');
    return res.status(404).json({message:'Discount not deleted ! '});
  }

  catch(err) {
    console.log('Inside catch block of /removeDiscount');
    return res.status(500).json({message:'Some error occured ! '});
  }
}); 


//ENPOINTS FOR FEEDBACKS WHEN VIEWED BY CUSTOMER FROM BELOW TILL LINE 987

app.post('/postFeedback',async (req,res)=>{ //Post user feedback
  console.log('Inside /postFeedback ! ');
  const {name,email,rating,message}=req.body;
  if(!email||!name||!rating||!message) {
    console.log('Please enter all fields ! ');
    return res.status(500).json({message:'Some fields are missing ! '});
  }
  try{
    console.log('Inside try block of /postFeedback !');
    const findUser=await Feedback.findOne({ //Check if user has already given a feedback
      email
    });

    if(findUser) { //User has already given a feedback
      console.log('User has already given a feedback , double feedback not allowed ! ');
      return res.status(400).json({message:'Feedback already given ! '});
    }
    console.log('User is giving feedback for the first time ! ');
    const insertItem=new Feedback({
      email,
      name,
      rating,
      message
    });
    await insertItem.save();
    console.log('Feedback given successfully ! ');
    return res.status(200).json({message:'Feedback given for the first time ! '});
  }
  catch(err) {
    console.log('Inside catch block of /postFeedback ! ',err);
    return res.status(500).json({message:'Some error occured ! '});
  }
});

app.get('/feedBacklist',async(req,res)=>{ //Get all the feedbacks
  console.log('Inside /feedBacklist ! '); 
  const {loggedEmail}=req.query;
  const groupedFeedbacks={}; //Feedbacks grouped by stars
  try{
    console.log('Inside try block of /feedBacklist ! ');
    const fetchItems=await Feedback.find({}).sort({createdAt:-1}); //Fetch all feedbacks and sort in descending order by date
    if(fetchItems.length>0) {
      console.log('Fetched all feedbacks , about to group by rating/stars ! ');
      fetchItems.forEach(item => {
        const { name, email, rating, message, createdAt } = item;

        // If no array exists for this rating, create it
        if (!groupedFeedbacks[rating]) {
          groupedFeedbacks[rating] = {
            rating,
            feedbacks: []
          };
        }
        // Only send threhsold amount of feedbacks in beginning
        if(groupedFeedbacks[rating].feedbacks.length<threshold) {
          if(email!==loggedEmail) { //Exlcude the feedback of logged in user
        groupedFeedbacks[rating].feedbacks.push({
          name,
          email,
          message,
          createdAt
        });
      }
        }
      });
      console.log('Feedbacks grouped successfully ! ');
      return res.status(200).json(groupedFeedbacks);   
    }
    console.log('Feedbacks do not exist ! ');
    return res.status(404).json({message:'Feedbacks do not exist ! '}); 
  }
  catch(err) {
    console.log('Inside catch block of /feedBacklist ! ',err);
    return res.status(500).json({message:'Some error occured ! '});
  }
});

app.get('/loggedFeedback',async(req,res)=>{ //Feedback of logged in user
  const {email}=req.query;
  if(!email) {
    console.log('Email is missing , /loggedFeedback ! ');
    return res.status(500).json({message:'Email is missing ! '});
  }
  try{
  console.log('Inside try block of /loggedFeedback , checking if user exists ! ');
  const checkUser=await Feedback.findOne({email}) //Check if user exists
  if(!checkUser) { //User does not exist
    console.log("User does not exist ! , /loggedFeedback ! ");
    return res.status(404).json({message:'User does not exist , i.e has never given a feedback ! '});
  } 
  console.log('User exists , i.e has given a feedback ! ');
  return res.status(200).json(checkUser); //Return the checkUser object
}
  catch(err) {
    console.log('Inside catch block of /loggedFeedback ! ');
  }
});

app.delete('/deleteFeedback',async(req,res)=>{ //Delete the feedback
  console.log('Inside /deleteFeedback ! ');
  const {email}=req.body;
  if(!email) {
    console.log('Email is missing , /deleteFeedback ! ');
    return res.status(500).json({message:'Email is missing , /deleteFeedback ! '});
  }
  try{
    console.log('Inside try block of /deleteFeedback ! ');
    const delItem=await Feedback.findOneAndDelete({email}); //Find and delete
    if(delItem) { //Feedback deleted
      console.log('Feedback deleted successfully ! ');
    return res.status(200).json({message:'Feedback deleted successfully ! '});
    }
    console.log('Feedback deletion unsuccessful ! ');
    return res.status(404).json({message:'Feedback deletion unsuccessful ! '});
  }
  catch(err) {
    console.log('Inside catch block of /deleteFeedback ! ',err);
    return res.status(500).json({message:'Some error occured ! '});
  }
});

app.get('/totalFeedbacks',async(req,res)=>{
  console.log('Inside /totalFeedbacks ! ');
  const {email}=req.query; 
  const totalFeedbacks=[]; //Array which will store total number of feedbacks per rating 
  try{
    console.log('Inside try block of /totalFeedbacks ! ');
    for(let i=0;i<5;i++) {
      const findFeedback=await Feedback.find({rating:(i+1),email: { $ne: email }});
      if(findFeedback.length>0) {
        totalFeedbacks[i]=findFeedback.length;
      }
      else { //No feeback for 'ith' rating
        totalFeedbacks[i]=0;
      }
    }
    console.log('for loop completed ! ');
    console.log('Value of feedback array before removing loggeduser is ',totalFeedbacks);
    if(totalFeedbacks[0]===0&&totalFeedbacks[1]===0&&totalFeedbacks[2]===0&&totalFeedbacks[3]===0&&totalFeedbacks[4]===0) { //No feedbacks found
      console.log('No feedbacks found ! ');
      return res.status(404).json({message:'No feedbacks found ! '});
    }
    console.log('Successfully retrieved total feedbacks  ! ');
    return res.status(200).json(totalFeedbacks); //User has never given a feedback
  }
  catch(err) {
    console.log('Inside catch block of /totalFeedbacks ! ',err);
    return res.status(500).json({message:'Some error occured ! '});
  }
});

app.get('/showMorefeedbacks',async(req,res)=>{
  console.log('Inside /showMorefeedbacks ! ');
  const {currentNum,email,rating}=req.query;
  if(!currentNum||!email||!rating) {
    console.log('CurrentNum or email or rating is missing ! ');
    return res.status(400).json({message:'Some entries are missing ! '});
  }
  try{
    console.log('Inside try block of /showMorefeedbacks ! ');
    const fetchMore = await Feedback.find({
      rating: parseInt(rating),
      email: { $ne: email } // Exclude user's own feedback
    }).sort({ createdAt: -1 })
    .skip(parseInt(currentNum))
    .limit(threshold);

    if(fetchMore.length>0) {
      return res.status(200).json(fetchMore); 
    }
    return res.status(404).json({message:'No more feedbacks ! '});
  }
  catch(err) {
    console.log('Inside catch block of /showMorefeedbacks ! ',err);
    return res.status(500).json({message:'Some error occured ! '});
  }
});

app.get('/thresholdValue',(req,res)=>{ //Returns the value of threshold 
  if(threshold!==0) {
    return res.status(200).json(threshold);
  }
  return res.status(404).json({message:'Threshold is 0 ! '});
});

//FEEDBACK ENDPOINTS FOR CASHIER STARTING

app.get('/CtotalFeedbacks',async(req,res)=>{
  console.log('Inside /totalFeedbacks ! ');
  const totalFeedbacks=[]; //Array which will store total number of feedbacks per rating 
  try{
    console.log('Inside try block of /totalFeedbacks ! ');
    for(let i=0;i<5;i++) {
      const findFeedback=await Feedback.find({rating:(i+1)});
      if(findFeedback.length>0) {
        totalFeedbacks[i]=findFeedback.length;
      }
      else { //No feeback for 'ith' rating
        totalFeedbacks[i]=0;
      }
    }
    console.log('for loop completed ! ');
    console.log('Value of feedback array before removing loggeduser is ',totalFeedbacks);
    if(totalFeedbacks[0]===0&&totalFeedbacks[1]===0&&totalFeedbacks[2]===0&&totalFeedbacks[3]===0&&totalFeedbacks[4]===0) { //No feedbacks found
      console.log('No feedbacks found ! ');
      return res.status(404).json({message:'No feedbacks found ! '});
    }
    console.log('Successfully retrieved total feedbacks  ! ');
    return res.status(200).json(totalFeedbacks); 
  }
  catch(err) {
    console.log('Inside catch block of /totalFeedbacks ! ',err);
    return res.status(500).json({message:'Some error occured ! '});
  }
});

app.get('/CshowMorefeedbacks',async(req,res)=>{
  console.log('Inside /showMorefeedbacks ! ');
  const {currentNum,rating}=req.query;
  if(!currentNum||!rating) {
    console.log('CurrentNum or rating is missing ! ');
    return res.status(400).json({message:'Some entries are missing ! '});
  }
  try{
    console.log('Inside try block of /showMorefeedbacks ! ');
    const fetchMore = await Feedback.find({
      rating: parseInt(rating)
    }).sort({ createdAt: -1 })
    .skip(parseInt(currentNum))
    .limit(threshold);

    if(fetchMore.length>0) {
      return res.status(200).json(fetchMore); 
    }
    return res.status(404).json({message:'No more feedbacks ! '});
  }
  catch(err) {
    console.log('Inside catch block of /showMorefeedbacks ! ',err);
    return res.status(500).json({message:'Some error occured ! '});
  }
});

app.get('/CfeedBacklist',async(req,res)=>{ //Get all the feedbacks
  console.log('Inside /feedBacklist ! '); 
  const groupedFeedbacks={}; //Feedbacks grouped by stars
  try{
    console.log('Inside try block of /feedBacklist ! ');
    const fetchItems=await Feedback.find({}).sort({createdAt:-1}); //Fetch all feedbacks and sort in descending order by date
    if(fetchItems.length>0) {
      console.log('Fetched all feedbacks , about to group by rating/stars ! ');
      fetchItems.forEach(item => {
        const { name, email, rating, message, createdAt } = item;

        // If no array exists for this rating, create it
        if (!groupedFeedbacks[rating]) {
          groupedFeedbacks[rating] = {
            rating,
            feedbacks: []
          };
        }
        // Only send threhsold amount of feedbacks in beginning
        if(groupedFeedbacks[rating].feedbacks.length<threshold) {
        groupedFeedbacks[rating].feedbacks.push({
          name,
          email,
          message,
          createdAt
        });
        }
      });
      console.log('Feedbacks grouped successfully ! ');
      return res.status(200).json(groupedFeedbacks);   
    }
    console.log('Feedbacks do not exist ! ');
    return res.status(404).json({message:'Feedbacks do not exist ! '}); 
  }
  catch(err) {
    console.log('Inside catch block of /feedBacklist ! ',err);
    return res.status(500).json({message:'Some error occured ! '});
  }
});

app.put('/updateDiscountName', async (req, res) => {
  const { name, newName } = req.body;

  if (!name || !newName) {
    console.log('Name or newName is missing , /updateDiscountName ! ');
    return res.status(400).json({ message: 'Name or newName is missing !' });
  }

  try {
    console.log('Inside try block of /updateDiscountName !');
    
    const findItem = await Discount.findOneAndUpdate(
      { name: name },              // Find by old name
      { $set: { name: newName } }, // Update to new name
      { new: true }                // Return updated document
    );

    if (findItem) {
      console.log('Updated !');
      return res.status(200).json({ message: 'Discount name updated !' });
    }

    return res.status(404).json({ message: 'Item not found !' });
  } catch (err) {
    console.log('Error in /updateDiscountName:', err);
    return res.status(500).json({ message: 'Some error occurred !' });
  }
});

app.listen(PORT, () => { //Start the server
  console.log(`✅ Server started on port ${PORT}!`);
});
