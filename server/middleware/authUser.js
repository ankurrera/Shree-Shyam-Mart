import jwt from 'jsonwebtoken';

const authUser = async (req, res, next)=>{
    const { token } = req.cookies;

    if(!token){
        return res.status(401).json({ success: false, message: 'Not Authorized: Missing Token' });
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
        if(tokenDecode.id){
            req.userId = tokenDecode.id;
            next();
        } else {
            return res.status(401).json({ success: false, message: 'Not Authorized: Invalid Token' });
        }
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Not Authorized: Token Expired or Invalid' });
    }
}

export default authUser;