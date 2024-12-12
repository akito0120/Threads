import { UserButton } from "@clerk/nextjs";
import {fetchPosts} from "@/lib/actions/thread.actions";
import {currentUser} from "@clerk/nextjs/server";
import ThreadCard from "@/components/cards/ThreadCard";
import {redirect} from "next/navigation";
import {fetchUser} from "@/lib/actions/user.actions";

export default async function Home() {
    const user = await currentUser();
    if(!user) redirect("/");

    const userInfo = fetchUser(user.id);
    if(!userInfo) redirect("/onboarding");

    const result = await fetchPosts(1, 30);

    console.log(result);
    console.log("Successfully fetched posts");

    return (
        <>
            <h1 className="head-text text-left">Home</h1>

            <section className="mt-9 flex flex-col gap-10">
                {result?.posts.length === 0 ? (
                    <p className="no-result">No Threads Found</p>
                ): (
                    <>
                        {result?.posts.map((post) => (
                            <ThreadCard
                                key={post._id}
                                id={post._id}
                                currentUserId={user?.id || ""}
                                parentId={post.parentId}
                                content={post.text}
                                createdAt={post.createdAt}
                                comments={post.children}
                                author={post.author}
                                community={post.community}
                            />
                        ))}
                    </>
                )}
            </section>
        </>
    );
}