"use client";

import Link from "next/link";
import Image from "next/image";
import {sidebarLinks} from "@/app/constants";
import {usePathname, useRouter} from "next/navigation";
import {SignedIn, SignOutButton, useAuth, useUser} from "@clerk/nextjs";

export default function LeftSidebar() {
    const router = useRouter();
    const pathName = usePathname();
    const { userId } = useAuth();

    return (
        <section className={"custom-scrollbar leftsidebar"}>
            <div className={"flex w-full flex-1 flex-col gap-6 px-6"}>
                {
                    sidebarLinks.map((link) => {
                        const isActive = (pathName.includes(link.route) && link.route.length > 1 || pathName == link.route);

                        if(userId && link.route === "/profile") link.route = `/profile/${userId}`;

                        return (
                            (
                                <Link
                                    href={link.route}
                                    key={link.label}
                                    className={`leftsidebar_link ${isActive && "bg-primary-500" }`}>
                                    <Image src={link.imgURL} alt={link.label} width={24} height={24}/>
                                    <p className={"text-light-1 max-lg:hidden"}>{link.label}</p>
                                </Link>
                            )
                        );
                    })
                }
            </div>

            <div className={"mt-10 px-6"}>
                <SignedIn>
                    <SignOutButton signOutOptions={{redirectUrl: "/sign-in"}}>
                        <div className={"flex cursor-pointer gap-4 p-4"}>
                            <Image src={"/assets/logout.svg"} alt={"Logout"} width={24} height={24}/>
                            <p className={"text-light-2  max-lg:hidden"}>Logout</p>
                        </div>
                    </SignOutButton>
                </SignedIn>
            </div>
        </section>
    );
}