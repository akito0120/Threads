"use server";

import {connectToDB} from "@/lib/mongoose";
import Thread from "@/lib/models/thread.model";
import User from "@/lib/models/user.model";
import {revalidatePath} from "next/cache";
import Community from "@/lib/models/community.model";

interface Params {
    text: string,
    author: string,
    communityId: string | null,
    path: string,

}

export async function createThread({text, author, communityId, path}: Params) {
    try{
        await connectToDB();

        const createdThread = await Thread.create({
            text,
            author,
            communityId: communityId
        });

        await User.findByIdAndUpdate(author, {
            $push: { threads: createdThread._id }
        })

        revalidatePath(path);
    }catch(error) {
        console.log(`Failed to create thread: ${error}`);
    }
}

export async function fetchPosts(pageNumber = 1, pageSize=  20) {
    try{
        await connectToDB();

        const skipAmount = (pageNumber - 1) * pageSize;

        // Only find parent threads, not comments
        const postsQuery = Thread.find({ parentId: { $in: [null, undefined ]}})
            .sort({ createdAt: "desc" })
            .skip(skipAmount)
            .limit(pageSize)
            .populate({ path: "author", model: User})
            .populate({
                path: "community",
                model: Community
            })
            .populate({
                path: "children",
                populate: {
                    path: "author",
                    model: User,
                    select: "_id name parent image"
                }
            });

        const totalPostsCount = await Thread.countDocuments({ parentId: { $in: [null, undefined ]}});

        const posts = await postsQuery.exec();
        const isNext = totalPostsCount > skipAmount + posts.length;

        return { posts, isNext };
    }catch(error) {
        console.log(`Failed to fetch posts: ${error}`);
    }
}

export async function fetchThreadById(id: string) {
    try{
        await connectToDB();

        const thread = await Thread
            .findById(id)
            .populate({
                path: "author",
                model: User,
                select: "_id id name image"
            })
            .populate({
                path: "children",
                populate: [
                    {
                        path: "author",
                        model: User,
                        select: "_id id name parentId image"
                    },
                    {
                        path: "children",
                        model: Thread,
                        populate: {
                            path: "author",
                            model: User,
                            select: "_id id name parentId image"
                        }
                    }
                ]
            })
            .exec();

        return thread;
    }catch(error) {
        console.log("Failed to fetch thread: " + error);
    }
}

export async function addCommentToThread(threadId: string, commentText: string, userId: string, path: string) {
    try{
        await connectToDB();

        const originalThread = await Thread.findById(threadId);

        if(!originalThread) throw new Error("Thread not found");

        const commentThread = new Thread({
            text: commentText,
            author: userId,
            parentId: threadId,
        });

        const savedCommentThread = await commentThread.save();
        originalThread.children.push(savedCommentThread._id);

        await originalThread.save();
        revalidatePath(path);
    }catch(error) {
        console.log(`Failed to add comment to thread: ${error}`);
    }
}