import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://veritumpro.com'

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/veritumpro/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
