import { NextResponse } from 'next/server';
import { getAdAccounts } from '@/lib/meta-api';

export async function GET() {
    try {
        const accessToken = process.env.META_ACCESS_TOKEN || '';
        if (!accessToken) {
            return NextResponse.json({ error: 'Missing access token' }, { status: 400 });
        }
        const accounts = await getAdAccounts(accessToken);
        return NextResponse.json({ data: accounts });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
