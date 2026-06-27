export function getApiOrigin() {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  return apiUrl.replace(/\/api\/?$/, '');
}
