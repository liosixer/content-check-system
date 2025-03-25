import https from 'https';
import qs from 'querystring';

const API_KEY = process.env.NEXT_PUBLIC_BAIDU_API_KEY;
const SECRET_KEY = process.env.NEXT_PUBLIC_BAIDU_SECRET_KEY;

interface BaiduAuthResponse {
  access_token: string;
  expires_in: number;
}

class BaiduApiService {
  private static instance: BaiduApiService;
  private accessToken: string | null = null;
  private tokenExpireTime: number = 0;

  private constructor() {}

  public static getInstance(): BaiduApiService {
    if (!BaiduApiService.instance) {
      BaiduApiService.instance = new BaiduApiService();
    }
    return BaiduApiService.instance;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    const params = qs.stringify({
      'grant_type': 'client_credentials',
      'client_id': API_KEY,
      'client_secret': SECRET_KEY
    });

    try {
      const response = await fetch(
        `https://aip.baidubce.com/oauth/2.0/token?${params}`,
        { method: 'GET' }
      );
      
      const data = await response.json() as BaiduAuthResponse;
      this.accessToken = data.access_token;
      this.tokenExpireTime = Date.now() + (data.expires_in - 60) * 1000; // 提前1分钟过期
      return this.accessToken;
    } catch (error) {
      console.error('获取百度API访问令牌失败:', error);
      throw new Error('获取访问令牌失败');
    }
  }

  public async textCensor(text: string) {
    try {
      const accessToken = await this.getAccessToken();
      const response = await fetch(
        `https://aip.baidubce.com/rest/2.0/solution/v1/text_censor/v2/user_defined?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: qs.stringify({ text })
        }
      );

      return await response.json();
    } catch (error) {
      console.error('文本审核失败:', error);
      throw new Error('文本审核失败');
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // 移除 data:image/jpeg;base64, 前缀
        resolve(base64.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  }

  public async imageCensor(image: File) {
    try {
      const accessToken = await this.getAccessToken();
      const base64 = await this.fileToBase64(image);

      const response = await fetch(
        `https://aip.baidubce.com/rest/2.0/solution/v1/img_censor/v2/user_defined?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: qs.stringify({ image: base64 })
        }
      );

      return await response.json();
    } catch (error) {
      console.error('图片审核失败:', error);
      throw new Error('图片审核失败');
    }
  }
}

export const baiduApi = BaiduApiService.getInstance(); 