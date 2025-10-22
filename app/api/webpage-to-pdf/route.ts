import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });
    }

    // URL 유효성 검사
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: '올바른 URL이 아닙니다.' }, { status: 400 });
    }

    console.log('웹페이지 캡처 시작:', url);

    // Puppeteer 브라우저 실행
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // 웹페이지 로드
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // PDF 생성
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    await browser.close();

    console.log('웹페이지 캡처 완료');

    // PDF 반환
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="webpage.pdf"',
      },
    });
  } catch (error) {
    console.error('웹페이지 캡처 오류:', error);
    return NextResponse.json(
      {
        error: '웹페이지를 캡처하는 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
