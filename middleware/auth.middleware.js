import jwt  from "jsonwebtoken";

const checkIfLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    
    if(!token){
      return res.status(400).json({
        message: "You need to login first!",
        success: false,
      })
    }
    const decryptedToken = jwt.verify(token, process.env.SECRET);
    req.user = decryptedToken;
    next();
  } catch (error) {
    return res.status(400).json({
      message: "Something went wrong",
      success: false,
    })
  }
};

export default checkIfLoggedIn;
