"use client"

import { useAuth } from "@/providers/authProvider";

const LOGOUT_URL = '/api/logout/'

export default function Page(){
  const auth = useAuth();

  async function handleClick(event){
    event.preventDefault();
    const requestOption = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: "",
    }
    const response = await fetch(LOGOUT_URL, requestOption);
    if (response.ok){
      console.log("Logged out successfully");
      auth.logout();
    }
  }

  return <div className="h-[95vh]">
    <div className="max-w-md mx-auto py-5">
      <h1>Are you sure you want to logout?</h1>
      <button className='bg-red-500 text-white hover:bg-red-300 px-3 py-2' onClick={handleClick}>Yes, logout</button>
    </div>
  </div> 
}