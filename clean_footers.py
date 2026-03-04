#!/usr/bin/env python3
import os
import re

# Clean footer HTML without fake trust claims
CLEAN_FOOTER = '''    <!-- Footer -->
    <footer>
        <div class="container">
            
            <div class="footer-grid">
                
                <div class="footer-col">
                    <h4>Visa Guides</h4>
                    <ul>
                        <li><a href="/visa-types/tourist/">Tourist Visa</a></li>
                        <li><a href="/visa-types/business/">Business Visa</a></li>
                        <li><a href="/visa-types/family-visit/">Family Visit</a></li>
                        <li><a href="/visa-rejection-guide/">Rejection Guide</a></li>
                    </ul>
                </div>
                
                <div class="footer-col">
                    <h4>Top Countries</h4>
                    <ul>
                        <li><a href="/countries/france/">🇫🇷 France</a></li>
                        <li><a href="/countries/germany/">🇩🇪 Germany</a></li>
                        <li><a href="/countries/spain/">🇪🇸 Spain</a></li>
                        <li><a href="/countries/italy/">🇮🇹 Italy</a></li>
                        <li><a href="/countries/">All Countries →</a></li>
                    </ul>
                </div>
                
                <div class="footer-col">
                    <h4>Documents</h4>
                    <ul>
                        <li><a href="/documents/required-documents/">All Documents</a></li>
                        <li><a href="/documents/cover-letter/">Cover Letter</a></li>
                        <li><a href="/documents/bank-statement/">Bank Statement</a></li>
                        <li><a href="/documents/travel-insurance/">Travel Insurance</a></li>
                    </ul>
                </div>
                
                <div class="footer-col">
                    <h4>Support</h4>
                    <ul>
                        <li><a href="/support/hotel-booking/">Hotel Booking</a></li>
                        <li><a href="/support/flight-reservation/">Flight Reservation</a></li>
                        <li><a href="/support/vfs-global/">VFS Global</a></li>
                        <li><a href="/contact/">Contact Us</a></li>
                    </ul>
                </div>
                
                <div class="footer-col">
                    <h4>Company</h4>
                    <ul>
                        <li><a href="/about/">About Us</a></li>
                        <li><a href="/privacy-policy/">Privacy Policy</a></li>
                        <li><a href="/terms-of-service/">Terms of Service</a></li>
                        <li><a href="/disclaimer/">Disclaimer</a></li>
                    </ul>
                </div>
                
            </div>
            
            <div class="footer-bottom">
                <p>&copy; 2026 SchengenVisaSupport.com. All rights reserved.</p>
                <p><small>Disclaimer: We are an independent information website. We do not provide visa services or appointment booking. Information is for guidance purposes only. Always verify with official embassy sources.</small></p>
            </div>
            
        </div>
    </footer>
    
    <!-- Back to Top Button -->
    <a href="#" class="back-to-top" aria-label="Back to top">
        <span>↑</span>
    </a>
    
    <!-- JavaScript -->
    <script src="/js/main.js" defer></script>
</body>
</html>'''

# Find all index.html files except the homepage (already done)
html_files = []
for root, dirs, files in os.walk('.'):
    for file in files:
        if file == 'index.html':
            filepath = os.path.join(root, file)
            if filepath != './index.html':  # Skip homepage, already cleaned
                html_files.append(filepath)

updated_count = 0
skipped_count = 0

for filepath in html_files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Skip if file doesn't have a footer
        if '<footer>' not in content:
            skipped_count += 1
            continue
        
        # Find the position of the footer start
        footer_pos = content.find('    <!-- Footer -->')
        if footer_pos == -1:
            footer_pos = content.find('    <footer>')
        
        if footer_pos == -1:
            footer_pos = content.find('<footer>')
        
        if footer_pos != -1:
            # Replace from footer to end
            new_content = content[:footer_pos] + CLEAN_FOOTER
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            updated_count += 1
            print(f"✓ Updated: {filepath}")
        else:
            skipped_count += 1
            print(f"⊘ Skipped (no footer found): {filepath}")
            
    except Exception as e:
        print(f"✗ Error in {filepath}: {str(e)}")
        skipped_count += 1

print(f"\n✅ Updated {updated_count} files")
print(f"⊘ Skipped {skipped_count} files")
