import ThreadCard from "@/components/cards/ThreadCard";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import {redirect, useParams} from "next/navigation";
import {fetchThreadById} from "@/lib/actions/thread.actions";
import Comment from "@/components/forms/Comment";


export default async function Page({ params }: { params: { id: string } }) {
    if(!params) {
        return null;
    }

    if(!params.id) {
        return null;
    }

    const user = await currentUser();

    if(!user) {
        return null;
    }

    const userInfo = await fetchUser(user.id);

    if(!userInfo.onboarded) redirect("/onboarding");

    const thread = await fetchThreadById(params.id);

    return (
        <section className="relative">
            <ThreadCard
                key={thread._id}
                id={thread._id}
                currentUserId={user?.id || ""}
                parentId={thread.parentId}
                content={thread.text}
                createdAt={thread.createdAt}
                comments={thread.children}
                author={thread.author}
                community={thread.community}
            />

            <div className="mt-7">
                <Comment
                    threadId={thread.id}
                    currentUserImg={userInfo.image}
                    currentUserId={JSON.stringify(userInfo._id)}
                />
            </div>

            <div className="mt-10">
                {
                    thread.children.map((item: any) => (
                        <ThreadCard
                            key={item._id}
                            id={item._id}
                            currentUserId={item?.id}
                            parentId={item.parentId}
                            content={item.text}
                            author={item.author}
                            community={item.community}
                            createdAt={item.createdAt}
                            comments={item.children}
                            isComment={true}
                        />
                    ))
                }
            </div>
        </section>
    )
}