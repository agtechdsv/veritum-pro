import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://veritumpro.com'

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/veritum/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
