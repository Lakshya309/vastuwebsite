// app/admin/AdminProjectTable.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

interface ProjectData {
  id: string;
  name: string;
  created_at: string;
  user_id: string;
  profiles: {
    email: string | null;
  } | null;
}

interface AdminProjectTableProps {
  projects: ProjectData[];
}

export default function AdminProjectTable({ projects }: AdminProjectTableProps) {
  if (!projects || projects.length === 0) {
    return <p>No projects found.</p>;
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold mb-4">All User Projects</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b text-left">Project Name</th>
              <th className="py-2 px-4 border-b text-left">Owner Email</th>
              <th className="py-2 px-4 border-b text-left">Created</th>
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b text-sm font-medium">{project.name}</td>
                <td className="py-2 px-4 border-b text-sm text-gray-600">{project.profiles?.email || 'N/A'}</td>
                <td className="py-2 px-4 border-b text-sm text-gray-600">
                  {format(new Date(project.created_at), 'PPP')}
                </td>
                <td className="py-2 px-4 border-b text-sm">
                  <Link href={`/projects/${project.id}/floor-plan`}>
                    <span className="text-indigo-600 hover:text-indigo-800 font-semibold">View Project →</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
