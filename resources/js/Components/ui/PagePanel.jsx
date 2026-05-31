import CardHeader from './CardHeader';

export default function PagePanel({ title, description, action, children, className = '' }) {
    return (
        <div className={`border border-gray-200 bg-white shadow-sm ${className}`}>
            <CardHeader title={title} description={description} action={action} />
            {children}
        </div>
    );
}
