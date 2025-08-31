import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJwt } from '@/lib/auth'
import { z } from 'zod'

const CreateTxnSchema = z.object({
  date: z.string(), // ISO date
  description: z.string().min(1),
  merchant: z.string().optional(),
  amountRupees: z.number().finite(),
  type: z.enum(['INFLOW', 'OUTFLOW']),
  category: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyJwt(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  const where: any = { userId: payload.userId }
  if (start || end) {
    where.date = {}
    if (start) (where.date as any).gte = new Date(start)
    if (end) (where.date as any).lte = new Date(end)
  }

  const txns = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
  })

  const data = txns.map(t => ({
    id: t.id,
    date: t.date.toISOString(),
    description: t.description,
    merchant: t.merchant,
    amountRupees: t.amountPaise / 100,
    type: t.type,
    category: t.category,
  }))

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = verifyJwt(token)
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const json = await req.json()
    const body = CreateTxnSchema.parse(json)

    const txn = await prisma.transaction.create({
      data: {
        userId: payload.userId,
        date: new Date(body.date),
        description: body.description,
        merchant: body.merchant,
        amountPaise: Math.round(body.amountRupees * 100),
        type: body.type,
        category: body.category,
      },
    })

    return NextResponse.json({ id: txn.id })
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

