import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function POST(req: NextRequest) {
  let browser = null;

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

    console.log('=== 웹페이지 캡처 시작 ===');
    console.log('URL:', url);
    console.log('Environment:', process.env.NODE_ENV);

    // Chromium 경로 확인
    let executablePath;
    try {
      executablePath = await chromium.executablePath();
      console.log('Chromium 경로:', executablePath);
    } catch (error) {
      console.error('Chromium 경로 찾기 실패:', error);
      return NextResponse.json(
        {
          error: 'Chromium을 찾을 수 없습니다.',
          details: error instanceof Error ? error.message : '알 수 없는 오류',
          suggestion: '로컬 환경에서는 Chromium을 직접 설치해야 할 수 있습니다.',
        },
        { status: 500 }
      );
    }

    // Puppeteer 브라우저 실행 설정
    const launchOptions = {
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
    };

    console.log('브라우저 실행 중...');
    browser = await puppeteer.launch(launchOptions);
    console.log('브라우저 실행 성공');

    const page = await browser.newPage();
    console.log('새 페이지 생성 완료');

    // User Agent 설정 (일부 사이트는 봇 차단)
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log('페이지 로딩 시작...');

    // 웹페이지 로드 (타임아웃 60초, waitUntil 옵션 완화)
    await page.goto(url, {
      waitUntil: 'domcontentloaded', // networkidle0 대신 domcontentloaded 사용
      timeout: 60000, // 60초로 증가
    });

    console.log('페이지 로딩 완료, 추가 대기 중...');

    // DOM이 완전히 렌더링될 때까지 추가 대기
    await page.waitForTimeout(2000);

    console.log('PDF 생성 중...');

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

    console.log('PDF 생성 완료, 크기:', pdf.length, 'bytes');

    await browser.close();
    browser = null;

    console.log('=== 웹페이지 캡처 성공 ===');

    // PDF 반환
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="webpage.pdf"',
      },
    });
  } catch (error) {
    console.error('=== 웹페이지 캡처 오류 ===');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // 브라우저가 열려있으면 닫기
    if (browser) {
      try {
        await browser.close();
        console.log('브라우저 정리 완료');
      } catch (closeError) {
        console.error('브라우저 닫기 실패:', closeError);
      }
    }

    // 구체적인 오류 메시지 생성
    let errorMessage = '웹페이지를 캡처하는 중 오류가 발생했습니다.';
    let suggestion = '';

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = '웹페이지 로딩 시간이 초과되었습니다.';
        suggestion = '페이지 로딩이 느린 사이트입니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message.includes('net::')) {
        errorMessage = '웹페이지에 접속할 수 없습니다.';
        suggestion = 'URL이 올바른지 확인하거나, 다른 URL로 시도해주세요.';
      } else if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
        errorMessage = '웹페이지 주소를 찾을 수 없습니다.';
        suggestion = 'URL 철자를 확인해주세요.';
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        suggestion: suggestion || 'URL을 확인하거나 잠시 후 다시 시도해주세요.',
      },
      { status: 500 }
    );
  }
}
