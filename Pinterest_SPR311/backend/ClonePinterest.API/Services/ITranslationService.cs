namespace ClonePinterest.API.Services;

public interface ITranslationService
{
    Task<string> TranslateToEnglishAsync(string text);
    bool IsUkrainianText(string text);
}

