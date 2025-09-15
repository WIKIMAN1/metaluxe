import React, { useState, useMemo } from 'react';
import { Customer, SocialPlatform } from '../types';
import { FacebookIcon, InstagramIcon, TikTokIcon } from './Icons';

const platformIcons: Record<SocialPlatform, React.ReactNode> = {
    [SocialPlatform.Facebook]: <FacebookIcon className="w-5 h-5 text-blue-500" />,
    [SocialPlatform.Instagram]: <InstagramIcon className="w-5 h-5 text-pink-500" />,
    [SocialPlatform.TikTok]: <TikTokIcon className="w-5 h-5 text-gray-200" />,
};

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="px-2 py-1 text-xs font-semibold leading-tight text-yellow-200 bg-yellow-900 bg-opacity-50 rounded-full">
        {children}
    </span>
);

const CustomersView: React.FC<{ customers: Customer[] }> = ({ customers }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCustomers = useMemo(() => {
        return customers.filter(customer =>
            customer.realName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [customers, searchTerm]);

    return (
        <div className="flex-1 p-8 bg-gray-900 overflow-y-auto">
            <h1 className="text-3xl font-bold text-white">Customers</h1>
            <p className="mt-1 text-gray-400">Manage your client database.</p>

            <div className="mt-6">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                    </span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-sm py-2 pl-10 pr-4 text-gray-200 bg-gray-800 border border-gray-700 rounded-md focus:border-yellow-500 focus:ring-yellow-500 focus:ring-opacity-40 focus:outline-none focus:ring"
                        placeholder="Search by name, username, or tag"
                    />
                </div>
            </div>

            <div className="mt-4 overflow-x-auto bg-gray-800 rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Platform</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tags</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Interaction</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {filteredCustomers.map((customer) => (
                            <tr key={customer.id} className="hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            <img className="h-10 w-10 rounded-full" src={customer.avatarUrl} alt="" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-200">{customer.realName}</div>
                                            <div className="text-sm text-gray-400">@{customer.username}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        {platformIcons[customer.platform]}
                                        <span className="text-sm text-gray-300">{customer.platform}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-wrap gap-1">
                                        {customer.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                    2 days ago
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <a href="#" className="text-yellow-400 hover:text-yellow-300">Edit</a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredCustomers.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No customers found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomersView;