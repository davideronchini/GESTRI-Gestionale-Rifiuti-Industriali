"use client"

import { useState } from "react";

const WAITLIST_API_URL = '/api/waitlists/'

export default function WaitlistForm(){
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('');

  async function handleSubmit(event){
    event.preventDefault();

    setMessage('');
    setErrors({});
    setError('');

    console.log(event, event.target);

    const formData = new FormData(event.target);
    const objectFromForm = Object.fromEntries(formData.entries());

    const jsonData = JSON.stringify(objectFromForm);
    const requestOption = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: jsonData,
    }
    const response = await fetch(WAITLIST_API_URL, requestOption);
    //const data = await response.json();
    if (response.status === 200 || response.status === 201){
      setMessage('You have been added to the waitlist.');
    }else{
      const data = await response.json();
      setErrors(data); 
      setError('Failed to join the waitlist.');
    }
  }

  return <div className="h-[95vh]">
    <div className="max-w-md mx-auto py-5">
      <h1>Login Here</h1>
      <form onSubmit={handleSubmit}>
        <div>{message && message}</div>
        <div>{error && error}</div>
        <div className={errors?.email ? "border border-red-500" : ""}>
        <input type="email" required name="email" placeholder="Your email"></input>
        {errors && errors?.email && errors?.email.length > 0 && <div className="p-2 border border-red-500 text-center text-red">
          {errors?.email.map((err, index)=>{return !err.message ? null : <p key={`err-${index}`}>{err.message}</p>})}
        </div> }
        </div>
        <button type='submit'>Join waitlist</button>
      </form>
    </div>
  </div> 
}