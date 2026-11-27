const {userModel} = require("../models/user");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/email");
const otp_generator = require("otp-generator");
const jwt = require("jsonwebtoken");

exports.signUp = async (req, res) => {
    try {
        const {fullName, email, password, age, gender} = req.body;
        const user = await userModel.findOne({email: email.toLowerCase()});

        if (user) {
            return res.status(400).json({
                message: `User with Email: ${email} already exist`
            })
        }

        const saltedRounds = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, saltedRounds);
        const otp = otp_generator(6, {lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false})

        const data = {
          fullName,
          email: email.toLowerCase(),
          password: hashedPassword,
          age,
          gender,
          otp
        };

        const newUser = await userModel.create(data);

        const emailContent = {
          name: newUser.fullName,
          email: newUser.email,
          subject: "Welcome to Zanzibar",
          htmlContent:
            `<html><head></head><body><p>Hello ${newUser.fullName},</p><p>We are happy to have you with us. Please use the OTP below to verify your existence and account to avoid being eliminated by Lord Darkseid.<br> ${otp} </p></body></html>`,
        };

        await sendEmail(emailContent);

        res.status(201).json({
            message: "User created successfully",
            data: newUser
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};


exports.getAllUsers = async (req, res) => {
    try {
        const allUsers = await userModel.find();

        res.status(200).json({
            message: `All users found and the total is ${allUsers.length}`,
            data: allUsers
        })
    } catch (error) {
        res.status(500).json({
          message: error.message,
        });
    }
};


exports.getOneUser = async (req, res) => {
    try {
        const {id} = req.params;
        const user = await userModel.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        res.status(200).json({
            message: "User found",
            data: user
        })
    } catch (error) {
        res.status(500).json({
          message: error.message,
        });
    }
};


exports.updateUser = async (req, res) => {
    try {
        const {id} = req.params;
        const { fullName, email, password, age, gender } = req.body;
        const user = await userModel.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        if (email) {
            const emailExists = await userModel.findOne({email: email.toLowerCase()});
            if (emailExists) {
                return res.status(400).json({
                    message: `This Email: ${email} already in use`
                })
            }
        };

        const data = {
          fullName,
          email: email.toLowerCase(),
          password,
          age,
          gender,
        };

        const updatedUser = await userModel.findByIdAndUpdate(id, data, {new: true});

        res.status(200).json({
            message: "User updated successfully",
            data: updatedUser
        })
    } catch (error) {
        res.status(500).json({
          message: error.message,
        });
    }
};


exports.deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await userModel.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        const deletedUser = await userModel.findByIdAndDelete(id);

        res.status(200).json({
            message: "User deleted successfully",
            data: deletedUser
        })
    } catch (error) {
        res.status(500).json({
          message: error.message,
        });
    }
};


exports.login = async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await userModel.findOne({email: email.toLowerCase()});
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (isPasswordCorrect == false) {
            return res.status(400).json({
                message: "Invalid Password"
            })
        };

        if (!user.isVerified) {
            return res.status(400).json({
                message: "User not verified. Please check your email for the OTP sent to you"
            })
        }

        const token = jwt.sign({
            id: user._id,
            email: user.email
        }, process.env.JWT_SECRET, {expiresIn: '30mins'})
        res.status(200).json({
            message: "Login successful",
            data: user,
            token
        })
    } catch (error) {
        res.status(500).json({
          message: error.message,
        });
    }
};


exports.verifyEmail = async (req, res) => {
    try {
        const {email, otp} = req.body;
        const user = await userModel.findOne({ email: email.toLowerCase() });
        if (!user) {
          return res.status(404).json({
            message: "User not found",
          });
        }

        if (user.otp !== otp) {
            return res.status(400).json({
                message: "Invalid OTP"
            })
        };

        user.isVerified = true;
        user.status = "Active";
        user.otp = null;

        await user.save();

        res.status(200).json({
            message: "Account Verification Successful",
            data: user
        });
    } catch (error) {
       res.status(500).json({
         message: error.message,
       }); 
    }
};


exports.forgotPassword = async (req, res) => {
    try {
        const {email} = req.body;
        const user = await userModel.findOne({email: email.toLowerCase()});
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        const otp = otp_generator.generate(6, {
          lowerCaseAlphabets: false,
          upperCaseAlphabets: false,
          specialChars: false,
        });

        const emailContent = {
          subject: "Password reset",
          email,
          name: user.fullName,
          htmlContent: `<html><head></head><body><p>Hello ${newUser.fullName},</p><p>Password reset link was initialised, below is your OTP. If you didn't initiate this request, please pay it no heed.<br> ${otp} </p></body></html>`,
        };

        user.otp = otp;
        await sendEmail(emailContent);
        await user.save();

        res.status(200).json({
            message: "Forgot Password is successful"
        })
    } catch (error) {
        res.status(500).json({
          message: error.message,
        }); 
    }
};


exports.resetPassword = async (req, res) => {
    try {
        const {email, otp, newPassword, confirmPassword} = req.body;
        const user = await userModel.findOne({email: email.toLowerCase()});
        if(!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        if (user.otp !== otp) {
            return res.status(401).json({
                message: "Invalid OTP"
            })
        };

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "Confirm Password does not match"
            })
        };

        const saltedRounds = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, saltedRounds);
        user.password = hashedPassword;
        user.otp = null;
        await user.save();

        res.status(200).json({
            message: "Password reset successful"
        });
    } catch (error) {
       res.status(500).json({
         message: error.message,
       });  
    }
}