import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    // You should replace this with your actual production URL
    const baseUrl = 'https://veritumpro.com'

    const modules = [
        'sentinel',
        'nexus',
        'scriptor',
        'valorem',
        'vox',
        'cognitio'
    ]

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 1,
        },
        ...modules.map(module => ({
            url: `${baseUrl}/${module}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        })),
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/pricing`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ]
}
