import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJwt } from '@/lib/auth'
import { analyzeTransactions } from '@/lib/analyze'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyJwt(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { start, end } = await req.json().catch(() => ({ start: undefined, end: undefined }))
  const where: any = { userId: payload.userId }
  if (start || end) {
    where.date = {}
    if (start) (where.date as any).gte = new Date(start)
    if (end) (where.date as any).lte = new Date(end)
  }
  const txns = await prisma.transaction.findMany({ where })

  const result = analyzeTransactions(
    txns.map(t => ({
      date: t.date.toISOString(),
      amountPaise: t.amountPaise,
      type: t.type,
      category: t.category,
    })),
    {
      start: start ? new Date(start) : undefined,
      end: end ? new Date(end) : undefined,
    }
  )

  return NextResponse.json({
    insights: result.insights,
    recommendations: result.recommendations,
    summary: {
      incomeRupees: Math.round(result.income / 100),
      expenseRupees: Math.round(result.expense / 100),
      netRupees: Math.round(result.net / 100),
    },
  })
}

