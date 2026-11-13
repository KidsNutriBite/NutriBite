import ast, os

files = ['state.py', 'algorithms.py', 'tools.py', 'nodes.py', 'graph.py', 'app.py']
base = os.path.dirname(os.path.abspath(__file__))
all_ok = True

for f in files:
    path = os.path.join(base, f)
    try:
        src = open(path, encoding='utf-8').read()
        ast.parse(src)
        print(f"  OK   {f}  ({len(src):,} chars)")
    except SyntaxError as e:
        print(f"  FAIL {f}: {e}")
        all_ok = False

print()
print("=" * 40)
print(f"All files syntactically valid: {all_ok}")
