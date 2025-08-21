import mongoose from "mongoose";
import { GenderEnum, RoleEnum } from "../../Common/enums/user.enum.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 20,
      lowercase: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 20,
      lowercase: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      minLength: 18,
      maxLength: 100,
      index: {
        name: "idx_age",
      },
    },
    gender: {
      type: String,
      enum: Object.values(GenderEnum),
      default: GenderEnum.MALE,
    },
    email: {
      type: String,
      required: true,
      index: {
        unique: true,
        name: "idx_email_unique",
      },
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    otps: {
      confermation: String,
      resetPassword: String,
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: Object.values(RoleEnum),
      default: RoleEnum.USER,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    virtuals: {
      fullName: {
        get() {
          return `${this.firstName} ${this.lastName}`;
        },
      },
    },
    methods: {
      getFullName() {
        return `${this.firstName} ${this.lastName}`;
      },
      getDoubleAge() {
        return this.age * 2;
      },
    },
  }
);

// Compound Index
userSchema.index(
  { firstName: 1, lastName: 1 },
  { name: "idx_first_last_unique", unique: true }
);

userSchema.virtual("Messages", {
  ref: "Message",
  localField: "_id",
  foreignField: "receiverId",
});

const Users = mongoose.model("User", userSchema);

export default Users;
