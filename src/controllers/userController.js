import User from "../models/userModel.js";
import createError from "http-errors";
import { successResponse } from "./responseController.js";
import { findWithId } from "../services/findWithId.js";
import deleteImage from "../helper/deleteImage.js";
import createJWT from "../helper/createJWT.js";
import { clientUrl, jwt_Activation_Key } from "../serect.js";
import emailWithNodeMailer from "../helper/email.js";

// import { json } from "body-parser";

const getUsers = async (req, res, next) => {
    try {
        const search = req.query.search || "";
        const page = req.query.page || 1;
        const limit = req.query.limit || 5;

        const searchRegex = new RegExp(".*" + search + ".*", "i");

        const filter = {
            isAdmin: { $ne: true },
            $or: [
                { name: { $regex: searchRegex } },
                { email: { $regex: searchRegex } },
                { phone: { $regex: searchRegex } },
            ],
        };
        const options = { password: 0 };

        const users = await User.find(filter, options)
            .limit(limit)
            .skip((page - 1) * limit);

        if (!users) throw createError(404, "No user found");

        const count = await User.find(filter).countDocuments();

        return successResponse(res, {
            statusCode: 200,
            message: "users was returned successfully",
            payload: {
                users,
                paginagtion: {
                    totalPage: Math.ceil(count / limit),
                    previousPage: page - 1 > 0 ? page - 1 : null,
                    currentPage: page,
                    nextPage:
                        page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

const getUser = async (req, res, next) => {
    try {
        const id = req.params.id;
        const options = { password: 0 };
        const user = await findWithId(User, id, options);

        return successResponse(res, {
            statusCode: 200,
            message: "user was returned successfully",
            payload: user,
        });
    } catch (error) {
        next(error);
    }
};
const deleteUser = async (req, res, next) => {
    try {
        const id = req.params.id;
        const options = { password: 0 };
        const user = await findWithId(User, id, options);
        const userImagePath = user.image;

        // delete user image
        deleteImage(userImagePath);

        await User.findByIdAndDelete({ _id: id }, { isAdmin: false });
        return successResponse(res, {
            statusCode: 200,
            message: "user was deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

const processRegister = async (req, res, next) => {
    try {
        const { name, email, password, phone, address } = req.body;

        const NewUser = {
            name,
            email,
            password,
            phone,
            address,
        };

        const existEmail = await User.exists({ email: email });
        if (existEmail) {
            throw createError(409, "Email already exist, Please login");
        }

        const token = createJWT({ NewUser }, jwt_Activation_Key, "10m");

        const EmailData = {
            email,
            subject: "Account Activation Link",
            html: `<h2>hello ${name}</h2>
            <p> Please click here to <a href='${clientUrl}/api/users/activate/${token}' target='_blank'>activate your account</a></p>`,
        };

        try {
            emailWithNodeMailer(EmailData);
        } catch (error) {
            next(
                createError(500, "filed to send email, Please try again later")
            );
        }

        return successResponse(res, {
            statusCode: 200,
            message: `please go to your email ${email} for compleate registration process`,
            payload: { token },
        });
    } catch (error) {
        next(error);
    }
};

export { getUsers, getUser, deleteUser, processRegister };
