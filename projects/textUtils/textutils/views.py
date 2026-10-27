# I have created this file - abdullah

from django.http import HttpResponse
from django.shortcuts import render

def index(request):
    return render(request, 'index.html')
    # return HttpResponse("Home")

def analyze(request):
    # Get the text
    djtext = request.POST.get('text', 'default')

    # Check the checkbox values
    removepunc = request.POST.get('removepunc', 'off')
    fullcaps = request.POST.get('fullcaps', 'off')
    newlineremove = request.POST.get('newlineremove', 'off')
    spaceremove = request.POST.get('spaceremove', 'off')
    charcount = request.POST.get('charcount', 'off')

    # Check which checkbox is on
    if removepunc == "on":
        punctuations = '''!”#$%&'()*+,-./:;<=>?@[\]^_`{|}'''
        analyzed = ""
        for char in djtext:
            if char not in punctuations:
                analyzed = analyzed + char

        params = {'purpose': 'Removed Punctuations', 'analyzed_text': analyzed}
        djtext = analyzed
    
    if(fullcaps == "on"):
        analyzed = ""
        for char in djtext:
            analyzed = analyzed + char.upper()

        params = {'purpose': 'Changed to Uppercase', 'analyzed_text': analyzed}
        djtext = analyzed
    
    if(newlineremove == "on"):
        analyzed = ""
        for char in djtext:
            if char != "\n" and char != "\r":
                analyzed = analyzed + char

        params = {'purpose': 'Removed Newlines', 'analyzed_text': analyzed}
        djtext = analyzed
    
    if(spaceremove == "on"):
        analyzed = ""
        for index, char in enumerate(djtext):
            if not (djtext[index] == " " and djtext[index+1] == " "):
                analyzed = analyzed + char

        params = {'purpose': 'Removed Extra Spaces', 'analyzed_text': analyzed}
        djtext = analyzed
    
    if(charcount == "on"):
        analyzed = 0
        for char in djtext:
            analyzed = analyzed + 1

        params = {'purpose': 'Character Count', 'analyzed_text': analyzed}
        # return render(request, 'analyze.html', params)

    if(removepunc != "on" and fullcaps != "on" and newlineremove != "on" and spaceremove != "on" and charcount != "on"):
        return render(request, 'error.html')
    
    return render(request, 'analyze.html', params)
