import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = walkSync(dirFile, filelist);
    } catch (err) {
      if (err.code === 'ENOTDIR' || err.code === 'EBADF') filelist.push(dirFile);
    }
  });
  return filelist;
}

const files = walkSync(path.join(__dirname, 'src')).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (file.endsWith('.jsx') && !content.includes('"use client"')) {
      content = '"use client";\n' + content;
      changed = true;
  }

  if (content.includes('react-router-dom')) {
      // Replace generic imports
      content = content.replace(/from\s+['"]react-router-dom['"]/g, "from 'next/navigation'");
      content = content.replace(/useNavigate/g, 'useRouter');
      // Fix Link
      content = content.replace(/import\s+\{([^}]*)Link([^}]*)\}\s+from\s+['"]next\/navigation['"];/g, "import { $1 $2 } from 'next/navigation';\nimport Link from 'next/link';");
      content = content.replace(/import\s+\{\s*\}\s+from\s+['"]next\/navigation['"];\n/g, "");
      changed = true;
  }

  if (content.includes('<Link ') && content.includes('to=')) {
      content = content.replace(/<Link([^>]+?)to=/g, "<Link$1href=");
      changed = true;
  }

  if (content.includes('useRouter()')) {
      content = content.replace(/const navigate = useRouter\(\);/g, "const router = useRouter();\n    const navigate = (path) => typeof path === 'number' && path < 0 ? router.back() : router.push(path);");
      changed = true;
  }

  if (content.includes('<Outlet')) {
      content = content.replace(/<Outlet\s*\/>/g, "{children}");
      changed = true;
  }
  
  if (content.includes('Outlet') && content.includes('next/navigation')) {
      content = content.replace(/Outlet,?/g, "");
      changed = true;
  }

  if (changed) {
      fs.writeFileSync(file, content);
      console.log('Processed:', file);
  }
});
