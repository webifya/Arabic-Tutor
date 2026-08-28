"use client";
import { signOut } from "next-auth/react";
export function LogoutButton(){return <button className="text-button" onClick={()=>signOut({callbackUrl:"/login"})}>লগআউট</button>}
