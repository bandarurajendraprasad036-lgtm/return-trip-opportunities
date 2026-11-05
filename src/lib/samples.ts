import type { Post } from '@/components/PostCard';
export function samplePosts(): Post[] {
  const areas = [['Hyderabad','Hyderabad','Telangana'],['Mancherial','Mancherial','Telangana'],['Guntur','Guntur','Andhra Pradesh'],['Warangal','Warangal','Telangana'],['Vijayawada','NTR','Andhra Pradesh']];
  return areas.flatMap(([location, district, state], i) => ['job','vehicle','service'].map((type, j) => ({
    id: `sample-${i}-${j}`, user_id: 'sample', module: type === 'vehicle' ? 'vehicle' : 'job', kind: type === 'vehicle' ? 'owner' : 'employer',
    title: type === 'vehicle' ? 'ఖాళీ గూడ్స్ వాహనం · Goods vehicle' : type === 'service' ? 'ప్లంబర్ కావాలి · Plumber needed' : 'షాప్ సహాయకుడు కావాలి · Shop helper',
    location: location ?? '', district: district ?? '', state: state ?? '', area_scope: 'local', service_type: type === 'service' ? 'plumber' : '', category: type === 'service' ? 'other' : 'shopkeeper',
    salary: type === 'job' ? '₹12,000 / నెల' : null, skill: type === 'job' ? 'Shop helper' : null, from_place: type === 'vehicle' ? location ?? '' : null, to_place: type === 'vehicle' ? 'Hyderabad' : null,
    visible_after: null, job_expires_at: null, trip_date: null, vehicle_type: type === 'vehicle' ? 'Tata Ace' : null, capacity_tons: null, goods_type: null, description: null, contact_phone: null, public_photo: '', public_brand: '', show_contact: false, status: 'active', created_at: '2026-11-04T00:00:00Z',
  })));
}