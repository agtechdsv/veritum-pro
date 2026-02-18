import { readFile } from 'fs/promises'
import { join } from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const filePath = join(process.cwd(), 'src', 'lib', 'schema.sql')
        const fileContent = await readFile(filePath, 'utf-8')
        return new NextResponse(fileContent, {
            headers: { 'Content-Type': 'text/plain' }
        })
    } catch (error) {
        return new NextResponse('Error loading schema', { status: 500 })
    }
}
