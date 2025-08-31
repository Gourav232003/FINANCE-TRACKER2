import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJwt } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyJwt(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as unknown as File | null
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const uploadsRoot = path.join(process.cwd(), 'uploads')
  await fs.mkdir(uploadsRoot, { recursive: true })

  const ts = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
  const storedName = `${payload.userId}_${ts}_${safeName}`
  const storedPath = path.join(uploadsRoot, storedName)

  await fs.writeFile(storedPath, buffer)

  const bill = await prisma.bill.create({
    data: {
      userId: payload.userId,
      originalFilename: file.name,
      storedPath: storedPath,
    }
  })

  return NextResponse.json({ id: bill.id, filename: bill.originalFilename })
}

