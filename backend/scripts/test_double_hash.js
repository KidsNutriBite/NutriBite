import mongoose from 'mongoose';
import User from '../models/User.model.js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'tharunreddy2112005@gmail.com' });
        if (!user) {
            console.log("User not found!");
            await mongoose.disconnect();
            return;
        }

        console.log("DB Password Hash:", user.password);

        // We want to see if the DB password hash is a bcrypt hash of another bcrypt hash.
        // Since we don't know the exact salt used for the first hash, we can't just hash it again.
        // BUT wait! If the DB hash is a bcrypt hash of a bcrypt hash, then:
        // bcrypt.compare(plainText, DB_hash) -> false
        // BUT if we compare the FIRST hash with the DB_hash, it should match!
        // But how do we get the first hash?
        // Ah! If the user registered via frontend, did they enter a plain text password,
        // and then the backend or model hashed it TWICE?
        // Wait, why would it hash it twice?
        // Let's check if the pre-save hook is called twice on User.create!
        // Wait, does Mongoose's save() run pre-save hooks twice?
        // Usually no. But what if we do `user.password = hashedPassword` in the controller,
        // and then `User.create` hashes it AGAIN because of the pre-save hook?
        // Let's check if the controller hashes the password before calling User.create!
        // Let's check auth.controller.js:
        // In registerUser:
        // const { name, email, password, role, title, ...roleData } = validation.data;
        // ...
        // const userData = { name, email, password, ... }
        // const user = await User.create(userData);
        // Here, it doesn't hash the password.
        //
        // Wait! Let's check if there is any other pre-save or post-save hook,
        // or if we have another model, or does the frontend hash it?
        // Let's check the code of backend/controllers/auth.controller.js resetPassword:
        // user.password = newPassword;
        // await user.save();
        // Here also, it doesn't hash the password manually, it relies on the pre-save hook.
        
        // Wait, let's look at the actual bcrypt.compare function.
        // Let's see if the password in DB is a hash of a hash of 'Password123'.
        // Wait! We can test this by hashing 'Password123' to get a hash H1, and then compare H1 to DB_hash?
        // No, because bcrypt hashes are random (due to random salt). Every time you call bcrypt.hash('Password123'), you get a DIFFERENT hash.
        // If the database has a double hash, then the database hash is `bcrypt.hash(H1)` where H1 is a specific hash of 'Password123'.
        // But we don't know H1! We can't recreate H1 because we don't know the salt that was used to create H1.
        // Wait! If H1 was saved in the DB, and then hashed AGAIN, could it be that it was saved, and then the save hook ran again?
        // Yes! If the document was saved, the pre-save hook ran and replaced `this.password` with `hash(plain)`.
        // Then, if it was saved a SECOND time, does `this.isModified('password')` return true?
        // Wait! If we do `await User.create(userData)`, Mongoose creates the user and saves it.
        // During this first save, `password` is modified, so it gets hashed.
        // Wait! Is there a second save?
        // What if another middleware or controller calls `user.save()`?
        // Wait! Is there any post-save or pre-save middleware in other files?
        // Let's search for `pre('save')` or `post('save')` or `pre("save")` in the backend.
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
