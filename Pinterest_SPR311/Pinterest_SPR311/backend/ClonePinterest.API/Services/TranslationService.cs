using System.Text.Json;
using System.Text.RegularExpressions;

namespace ClonePinterest.API.Services;

public class TranslationService : ITranslationService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<TranslationService> _logger;
    private static readonly Regex UkrainianPattern = new(@"\p{IsCyrillic}", RegexOptions.Compiled);

    private readonly Dictionary<string, string> _commonTranslations = new()
    {
        { "природа", "nature" },
        { "їжа", "food" },
        { "подорож", "travel" },
        { "мода", "fashion" },
        { "мистецтво", "art" },
        { "тварини", "animals" },
        { "люди", "people" },
        { "краса", "beauty" },
        { "архітектура", "architecture" },
        { "спорт", "sport" },
        { "автомобілі", "cars" },
        { "музика", "music" },
        { "квіти", "flowers" },
        { "море", "ocean" },
        { "гори", "mountains" },
        { "місто", "city" },
        { "пляж", "beach" },
        { "сонце", "sun" },
        { "ніч", "night" },
        { "день", "day" },
        { "коти", "cats" },
        { "кіт", "cat" },
        { "кішка", "cat" },
        { "собаки", "dogs" },
        { "собака", "dog" },
        { "птахи", "birds" },
        { "птах", "bird" },
        { "квітка", "flower" },
        { "дерево", "tree" },
        { "вода", "water" },
        { "небо", "sky" },
        { "хмари", "clouds" },
        { "дощ", "rain" },
        { "сніг", "snow" },
        { "літо", "summer" },
        { "зима", "winter" },
        { "весна", "spring" },
        { "осінь", "autumn" }
    };

    public TranslationService(HttpClient httpClient, ILogger<TranslationService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public bool IsUkrainianText(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return false;

        if (text.Length < 2)
            return false;

        var ukrainianChars = text.Count(c => UkrainianPattern.IsMatch(c.ToString()));
        var ukrainianRatio = (double)ukrainianChars / text.Length;
        
        if (ukrainianRatio < 0.3)
            return false;

        if (text.Length > 10)
        {
            var hasVowels = text.Any(c => "аеиіоуяюєї".Contains(c, StringComparison.OrdinalIgnoreCase));
            if (!hasVowels)
                return false;
        }

        return true;
    }

    public async Task<string> TranslateToEnglishAsync(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return text;

        if (!IsUkrainianText(text))
            return text;

        text = text.Trim().ToLower();

        if (_commonTranslations.ContainsKey(text))
        {
            return _commonTranslations[text];
        }

        try
        {
            var url = $"https://api.mymemory.translated.net/get?q={Uri.EscapeDataString(text)}&langpair=uk|en";
            var response = await _httpClient.GetAsync(url);

            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<MyMemoryResponse>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (result?.ResponseData?.TranslatedText != null)
                {
                    var translated = result.ResponseData.TranslatedText.Trim();
                    if (!string.IsNullOrWhiteSpace(translated) && translated != text)
                    {
                        _logger.LogInformation("Translated '{Text}' to '{Translated}'", text, translated);
                        return translated;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to translate text: {Text}", text);
        }

        _logger.LogWarning("Translation failed for '{Text}', returning original", text);
        return text;
    }

    private class MyMemoryResponse
    {
        public ResponseData? ResponseData { get; set; }
    }

    private class ResponseData
    {
        public string? TranslatedText { get; set; }
    }
}

