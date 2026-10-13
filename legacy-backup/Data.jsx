export const vendors = [
    { id: 'v1', name: 'Fauran Gulberg Hub', type: 'Dark store', owner: 'Fauran Operations', area: 'Gulberg III', city: 'Lahore', status: 'Active', products: 1248, rating: 4.8, orders: 4820, accuracy: '98.4%', joined: '12 Jan 2024' },
    { id: 'v2', name: 'Khan General Store', type: 'Partner kiryana', owner: 'Muhammad Khan', area: 'DHA Phase 5', city: 'Lahore', status: 'Active', products: 684, rating: 4.6, orders: 2941, accuracy: '96.9%', joined: '08 Feb 2024' },
    { id: 'v3', name: 'Fresh Basket Model Town', type: 'Partner kiryana', owner: 'Sana Qureshi', area: 'Model Town', city: 'Lahore', status: 'Pending approval', products: 412, rating: 0, orders: 0, accuracy: '—', joined: '06 Oct 2026' },
    { id: 'v4', name: 'Fauran Johar Town Hub', type: 'Dark store', owner: 'Fauran Operations', area: 'Johar Town', city: 'Lahore', status: 'Active', products: 1087, rating: 4.7, orders: 3784, accuracy: '97.8%', joined: '19 Mar 2024' },
    { id: 'v5', name: 'Al-Madina Mart', type: 'Partner kiryana', owner: 'Adeel Raza', area: 'Wapda Town', city: 'Lahore', status: 'Suspended', products: 256, rating: 4.1, orders: 1120, accuracy: '91.2%', joined: '23 Apr 2024' },
    { id: 'v6', name: 'Daily Needs Bahria', type: 'Partner kiryana', owner: 'Hira Malik', area: 'Bahria Town', city: 'Lahore', status: 'Active', products: 730, rating: 4.5, orders: 2108, accuracy: '95.5%', joined: '04 Jun 2024' },
];
export const riders = [
    { id: 'r1', name: 'Hamza Tariq', phone: '+92 300 812 4481', zone: 'Gulberg III', status: 'Online', deliveries: 1824, rating: 4.9, joined: '12 Jan 2024' },
    { id: 'r2', name: 'Bilal Ahmed', phone: '+92 321 901 2234', zone: 'DHA Phase 5', status: 'Online', deliveries: 1436, rating: 4.8, joined: '08 Feb 2024' },
    { id: 'r3', name: 'Usman Khalid', phone: '+92 333 550 1442', zone: 'Model Town', status: 'Offline', deliveries: 988, rating: 4.6, joined: '15 Mar 2024' },
    { id: 'r4', name: 'Maha Iqbal', phone: '+92 301 777 0912', zone: 'Johar Town', status: 'Pending approval', deliveries: 0, rating: 0, joined: '06 Oct 2026' },
    { id: 'r5', name: 'Talha Rauf', phone: '+92 315 641 7832', zone: 'Wapda Town', status: 'Offline', deliveries: 756, rating: 4.5, joined: '03 Apr 2024' },
];
export const orders = [
    { id: '#FR-10482', customer: 'Ayesha Siddiqui', vendor: 'Fauran Gulberg Hub', rider: 'Hamza Tariq', total: 'PKR 3,240', status: 'Out for delivery', time: 'Today, 11:42 AM', address: 'Block H, Gulberg III', items: ['Farm fresh milk × 2', 'Bananas × 1', 'Brown bread × 1'] },
    { id: '#FR-10481', customer: 'Ali Zain', vendor: 'Khan General Store', rider: 'Bilal Ahmed', total: 'PKR 1,860', status: 'Packed', time: 'Today, 11:31 AM', address: 'Street 14, DHA Phase 5', items: ['Basmati rice × 1', 'Cooking oil × 2', 'Tea pack × 1'] },
    { id: '#FR-10480', customer: 'Sara Mahmood', vendor: 'Fauran Johar Town Hub', rider: 'Usman Khalid', total: 'PKR 4,560', status: 'Delivered', time: 'Today, 11:18 AM', address: 'A Block, Johar Town', items: ['Fruit box × 1', 'Yogurt × 4', 'Granola × 2'] },
    { id: '#FR-10479', customer: 'Zainab Hassan', vendor: 'Daily Needs Bahria', rider: 'Talha Rauf', total: 'PKR 950', status: 'Placed', time: 'Today, 10:56 AM', address: 'Sector C, Bahria Town', items: ['Eggs × 1', 'Bread × 1', 'Juice × 2'] },
    { id: '#FR-10478', customer: 'Omar Farooq', vendor: 'Al-Madina Mart', rider: '—', total: 'PKR 2,210', status: 'Cancelled', time: 'Today, 10:44 AM', address: 'Wapda Town', items: ['Frozen parathas × 2', 'Ketchup × 1'] },
    { id: '#FR-10477', customer: 'Hina Aslam', vendor: 'Fauran Gulberg Hub', rider: 'Hamza Tariq', total: 'PKR 1,420', status: 'Delivered', time: 'Today, 10:22 AM', address: 'Main Boulevard, Gulberg', items: ['Coffee × 1', 'Cereal × 1', 'Apples × 1'] },
];
export const customers = [
    { id: 'c1', name: 'Ayesha Siddiqui', phone: '+92 300 182 0021', orders: 38, spent: 'PKR 92,440', joined: '19 Jan 2024', status: 'Active', email: 'ayesha.siddiqui@example.com' },
    { id: 'c2', name: 'Ali Zain', phone: '+92 321 771 4492', orders: 26, spent: 'PKR 61,580', joined: '04 Feb 2024', status: 'Active', email: 'ali.zain@example.com' },
    { id: 'c3', name: 'Sara Mahmood', phone: '+92 333 413 1028', orders: 21, spent: 'PKR 48,290', joined: '17 Feb 2024', status: 'Active', email: 'sara.mahmood@example.com' },
    { id: 'c4', name: 'Zainab Hassan', phone: '+92 301 621 8110', orders: 13, spent: 'PKR 30,960', joined: '02 Apr 2024', status: 'Suspended', email: 'zainab.hassan@example.com' },
    { id: 'c5', name: 'Omar Farooq', phone: '+92 315 198 7661', orders: 9, spent: 'PKR 21,340', joined: '12 May 2024', status: 'Active', email: 'omar.farooq@example.com' },
];
export const categories = [
    { id: 'cat1', icon: '🥬', name: 'Fruits & Vegetables', count: 286, color: 'green' },
    { id: 'cat2', icon: '🥛', name: 'Dairy & Breakfast', count: 194, color: 'blue' },
    { id: 'cat3', icon: '🍞', name: 'Bakery', count: 98, color: 'orange' },
    { id: 'cat4', icon: '🧴', name: 'Household', count: 312, color: 'purple' },
    { id: 'cat5', icon: '🍪', name: 'Snacks & Beverages', count: 428, color: 'coral' },
    { id: 'cat6', icon: '🧼', name: 'Personal Care', count: 176, color: 'teal' },
    { id: 'cat7', icon: '🍚', name: 'Staples', count: 208, color: 'yellow' },
    { id: 'cat8', icon: '🐾', name: 'Pet Care', count: 64, color: 'pink' },
];
export const disputes = [
    { id: 'd1', order: '#FR-10465', customer: 'Maryam Nadeem', vendor: 'Fauran Gulberg Hub', reason: 'Missing items in delivery', status: 'Open', created: 'Today, 09:12 AM' },
    { id: 'd2', order: '#FR-10398', customer: 'Fahad Mir', vendor: 'Khan General Store', reason: 'Product quality concern', status: 'Open', created: 'Yesterday, 04:40 PM' },
    { id: 'd3', order: '#FR-10221', customer: 'Nida Arshad', vendor: 'Daily Needs Bahria', reason: 'Late delivery', status: 'Resolved', created: '04 Oct 2026' },
];
export const reviews = [
    { id: 'rv1', author: 'Ayesha Siddiqui', target: 'Fauran Gulberg Hub', rating: 5, text: 'Everything arrived chilled and packed really well. This is my go-to grocery app now.', time: 'Today, 10:03 AM', kind: 'Vendor' },
    { id: 'rv2', author: 'Ali Zain', target: 'Bilal Ahmed', rating: 2, text: 'Rider was polite but the order reached much later than the promised window.', time: 'Yesterday, 06:18 PM', kind: 'Rider' },
    { id: 'rv3', author: 'Sara Mahmood', target: 'Fauran Johar Town Hub', rating: 4, text: 'Good product quality and the substitutions were thoughtfully chosen.', time: 'Yesterday, 02:31 PM', kind: 'Vendor' },
];
export const activity = [
    { icon: 'order', title: 'Order #FR-10482 placed', detail: 'Ayesha Siddiqui · PKR 3,240', time: '2 min ago' },
    { icon: 'vendor', title: 'New vendor application', detail: 'Fresh Basket Model Town', time: '18 min ago' },
    { icon: 'rider', title: 'Rider approval requested', detail: 'Maha Iqbal · Johar Town', time: '42 min ago' },
    { icon: 'check', title: 'Order #FR-10480 delivered', detail: 'Sara Mahmood · 24 items', time: '1 hr ago' },
];
