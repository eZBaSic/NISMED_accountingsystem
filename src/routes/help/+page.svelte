<script lang="ts">
  import { onMount } from 'svelte';

  // Markdown content for the help page
  let markdownContent = `
# NISMED Accounting System - User Guide

Welcome to the NISMED Accounting System! This guide will help you navigate and use the system effectively.

## 🏠 Dashboard
The **Dashboard** is your main hub where you can:
- View system statistics (total projects, vouchers, and financial summaries)
- Quick navigation to all major sections
- Export data as CSV files (projects and vouchers)

## 📋 Vouchers
The **Vouchers** section allows you to:
- **Add new vouchers** by filling out the form and clicking "Add Row"
- **Edit vouchers** by clicking directly on table cells
- **Sort vouchers** by clicking on column headers (DV No., Name, Date)
- **Save individual vouchers** using the "Save" button in each row
- **Save all vouchers** at once using the "Save All" button
- **Delete vouchers** using the "Delete" button in each row
- **Select projects** from the dropdown to associate vouchers with specific projects

## 🏗️ Projects
The **Projects** section lets you:
- **View all projects** in a organized table
- **Add new projects** with code, title, tax information, and responsible parties
- **Edit existing projects** by clicking on table cells
- **Delete projects** using the delete button (⚠️ be careful, this cannot be undone)
- **Save changes** using the save buttons

## 📊 Reports
The **Reports** section provides:
- **Project-specific voucher views** - select a project to see its vouchers
- **PDF generation** - generate individual voucher PDFs or complete project reports
- **Advanced editing** - edit vouchers with a detailed modal interface
- **Sorting and filtering** - organize data by various criteria
- **Voucher management** - edit and delete vouchers within project context

## 💡 General Tips

### Navigation
- Use the **green navigation bar** at the top to move between sections
- The **NISMED logo** always takes you back to the dashboard
- Your **email address** is displayed in the top-right corner

### Data Entry
- **Click directly on table cells** to edit values
- **Press Enter** or click outside to save changes
- **Use the dropdown menus** to select from existing options
- **Required fields** are marked and must be filled

### Saving Data
- **Individual saves** - use row-specific save buttons for single entries
- **Bulk saves** - use "Save All" to save multiple entries at once
- **Auto-save** - some fields save automatically when you click away

### Sorting and Organization
- **Click column headers** to sort data (clicking again reverses the order)
- **Use project filters** in Reports to focus on specific projects
- **Date fields** use the format YYYY-MM-DD

### Data Export
- **CSV exports** are available from the Dashboard
- **PDF reports** can be generated from the Reports section
- **Exports include** all current data visible in the system

## 🔐 Security
- **Always log out** when finished using the system
- **Keep your password secure** - never share your login credentials
- **Session timeout** - you'll be automatically logged out after inactivity

## ❓ Need More Help?
If you encounter any issues or need additional assistance:
1. Try refreshing the page
2. Check that all required fields are filled correctly
3. Ensure you have a stable internet connection
4. Contact your system administrator if problems persist

## 📝 System Information
- **Built for**: NISMED Educational Institute
- **Purpose**: Financial voucher and project management
- **Last Updated**: August 2025

---

*This help documentation can be updated as needed. Contact your system administrator for modifications.*
`;

  // Convert markdown to HTML (simple conversion)
  let htmlContent = '';

  onMount(() => {
    // Simple markdown to HTML conversion
    htmlContent = markdownContent
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold text-green-800 mb-6">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold text-green-700 mb-4 mt-8">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-medium text-green-600 mb-3 mt-6">$1</h3>')
      .replace(/^\*\*(.*?)\*\*/gm, '<strong class="font-semibold text-green-800">$1</strong>')
      .replace(/^\*(.*?)$/gm, '<em class="italic">$1</em>')
      .replace(/^- (.*$)/gm, '<li class="ml-4 mb-2">$1</li>')
      .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 mb-2">$2</li>')
      .replace(/^---$/gm, '<hr class="my-8 border-green-200">')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/`(.*?)`/g, '<code class="bg-green-50 px-2 py-1 rounded text-green-800 font-mono text-sm">$1</code>')
      .replace(/⚠️/g, '<span class="text-orange-500">⚠️</span>')
      .replace(/💡/g, '<span class="text-yellow-500">💡</span>')
      .replace(/🏠/g, '<span class="text-blue-500">🏠</span>')
      .replace(/📋/g, '<span class="text-gray-600">📋</span>')
      .replace(/🏗️/g, '<span class="text-orange-600">🏗️</span>')
      .replace(/📊/g, '<span class="text-purple-600">📊</span>')
      .replace(/🔐/g, '<span class="text-red-600">🔐</span>')
      .replace(/❓/g, '<span class="text-blue-400">❓</span>')
      .replace(/📝/g, '<span class="text-green-600">📝</span>')
      .split('\n')
      .map(line => {
        if (line.trim() === '') return '<br>';
        if (line.startsWith('<h') || line.startsWith('<hr') || line.startsWith('<li')) return line;
        if (line.trim().startsWith('-')) return line;
        return `<p class="mb-4 leading-relaxed">${line}</p>`;
      })
      .join('\n')
      .replace(/<br>\s*<br>/g, '<br>')
      .replace(/(<li.*?>.*?<\/li>)/gs, '<ul class="list-disc list-inside mb-4 space-y-1">$1</ul>')
      .replace(/<\/ul>\s*<ul[^>]*>/g, '');
  });
</script>

<svelte:head>
  <title>Help - NISMED Accounting System</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
  <div class="bg-white rounded-lg shadow-sm border border-green-100 p-8">
    <div class="help-content prose prose-green max-w-none">
      {@html htmlContent}
    </div>

    <div class="mt-12 pt-6 border-t border-green-100">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-500">
          Last updated: August 10, 2025
        </div>
        <a 
          href="/dashboard" 
          class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
        >
          ← Back to Dashboard
        </a>
      </div>
    </div>
  </div>
</div>

<style>
  .help-content {
    line-height: 1.7;
  }

  :global(.help-content h1) {
    border-bottom: 3px solid #059669;
    padding-bottom: 0.5rem;
  }

  :global(.help-content h2) {
    border-bottom: 2px solid #10b981;
    padding-bottom: 0.25rem;
  }

  :global(.help-content ul) {
    margin-left: 1rem;
  }

  :global(.help-content li) {
    margin-bottom: 0.5rem;
    position: relative;
  }

  :global(.help-content code) {
    font-size: 0.9em;
  }

  :global(.help-content strong) {
    color: #059669;
  }
</style>
