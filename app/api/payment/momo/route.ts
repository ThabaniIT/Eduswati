
import { NextResponse } from 'next/server'

// Temporary response until the MTN MoMo Payments v1
// integration is implemented.
// Never activate a subscription without verified payment.
export async function POST() {
  return NextResponse.json(
    {
      error: 'MTN MoMo payments are not configured yet.',
      code: 'PAYMENT_INTEGRATION_NOT_IMPLEMENTED',
    },
    { status: 501 }
  )
}
