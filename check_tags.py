
import re

def check():
    try:
        with open('e:\\webapp\\src\\pages\\VendorDashboard.jsx', 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return

    stack = []
    # simplified parser logic from before
    i = 0
    line_num = 1
    length = len(content)
    
    while i < length:
        char = content[i]
        if char == '\n':
            line_num += 1
            i+=1
            continue
        
        if char == '<':
            start_i = i
            is_closing = False
            i += 1
            if i < length and content[i] == '/':
                is_closing = True
                i += 1
            
            tag_start = i
            while i < length and (content[i].isalnum() or content[i] in '._-'):
                i += 1
            tag_name = content[tag_start:i]
            
            # handle <>
            if tag_name == '' and i < length and content[i] == '>':
                pass # <>
            elif tag_name == '' and is_closing and i < length and content[i] == '>':
                pass # </>
            
            # skip attrs
            while i < length:
                 if content[i] == '>': break
                 if content[i] == '\n': line_num += 1
                 # fast skip quotes
                 if content[i] == '"':
                     i+=1
                     while i<length and content[i]!='"':
                         if content[i] == '\n': line_num+=1
                         i+=1
                 i+=1
            
            if i >= length: break
            
            is_self = (content[i-1] == '/')
            i += 1
            
            if tag_name == '': tag_name = '<>'
            
            if is_self: continue
            if tag_name in ['br','hr','img','input']: continue
            
            if is_closing:
                if not stack:
                    print(f"Err: Unexp close {tag_name} L{line_num}")
                    return
                last = stack.pop()
                if last != tag_name:
                    print(f"Err: Exp {last} Fnd {tag_name} L{line_num}")
                    return
            else:
                stack.append(tag_name)
    
    if stack:
        print(f"Err: Unclosed {stack[-1]}")
    else:
        print("OK")

check()
