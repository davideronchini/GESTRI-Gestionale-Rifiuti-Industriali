import { deleteTokens } from "@/utils/auth";
import { NextResponse } from "next/server";


export async function POST(request) {
  deleteTokens()
  return NextResponse.json({}, { status: 200 })
}