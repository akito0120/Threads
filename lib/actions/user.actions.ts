"use server";

import User from "@/lib/models/user.model";

import {connectToDB} from "@/lib/mongoose";
import {revalidatePath} from "next/cache";
import Thread from "@/lib/models/thread.model";
import {FilterQuery, SortOrder} from "mongoose";


export async function updateUser({ userId, username, name, bio, image, path}: {
    userId: string,
    username: string,
    name: string,
    bio: string,
    image: string,
    path: string
})
    : Promise<void> {

    try{
        connectToDB();

        await User.findOneAndUpdate(
            { id: userId },
            {
                username: username.toLowerCase(),
                name,
                bio,
                image,
                onboarded: true,
            },
            { upsert: true }
        );

        if(path === "/profile/edit") {
            revalidatePath(path);
        }
    }catch(error) {
        throw new Error(`Failed to create/update user: ${error}`);
    }
}


export async function fetchUser(userId: string) {
    try{
        connectToDB();

        return await User
            .findOne({id: userId})
            // .populate({path: "communities", model: Community});
    }catch(error) {
        console.log(`Failed to fetch data: ${error}`);
    }
}

export async function fetchUserPosts(userId: string) {
    try{
        connectToDB();


        const threads = await User
            .findOne({ id: userId })
            .populate({
                path: "threads",
                model: Thread,
                populate: {
                    path: "children",
                    model: Thread,
                    populate: {
                        path: "author",
                        model: User,
                        select: "name image id"
                    }
                }
            });

        return threads;
    }catch(error) {
        console.log(`Failed to fetch user posts: ${error}`);
    }
}

export async function fetchUsers(
    {
        userId,
        searchString = "",
        pageNumber = 1,
        pageSize = 20,
        sortBy = "desc"
    }: {
        userId: string,
        searchString?: string,
        pageNumber?: number,
        pageSize?: number,
        sortBy?: SortOrder
    }
) {
    try{
        await connectToDB();

        const skipAmount = (pageNumber - 1) * pageSize;
        const regex = new RegExp(searchString, "i");

        const query: FilterQuery<typeof User> = {
            id: { $ne: userId }
        };

        if(searchString.trim() !== "") {
            query.$or = [
                { username: { $regex: regex } },
                { name: { $regex: regex } },
            ]
        }

        const sortOptions = {
            createdAt: sortBy
        };

        const userQuery = User
            .find(query)
            .skip(skipAmount)
            .limit(pageSize);

        const totalUserCount = await User.countDocuments(query);

        const users = await userQuery.exec();

        const isNext = totalUserCount > skipAmount + users.length;

        return { users, isNext };
    }catch(error) {
        console.log(`Failed to fetch users: ${error}`);
    }
}

export async function getActivity(userId: string) {
    try{
        await connectToDB();

        const userThreads = await Thread.find({ author: userId });

        const childThreadIds = userThreads.reduce((acc, userThread) => {
            return acc.concat(userThread.children);
        }, []);

        const replies = await Thread
            .find({
                _id: { $in: childThreadIds },
                author: { $ne: userId }
            })
            .populate({
                path: "author",
                model: User,
                select: "name image _id"
            });

        return replies;
    }catch(error) {
        console.log(`Failed to get activity: ${error}`);
    }
}