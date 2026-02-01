from rest_framework import serializers
from .models import SubmissionRating

class SubmissionRatingSerializer(serializers.ModelSerializer):
    rater = serializers.StringRelatedField(read_only=True)
    rater_id = serializers.IntegerField(source='rater.id', read_only=True)

    class Meta:
        model = SubmissionRating
        fields = ['id', 'submission', 'rater', 'rater_id', 'score', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['rater', 'rater_id', 'created_at', 'updated_at']

    def validate_score(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Score must be between 1 and 5')
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['rater'] = user
        if user.role not in ['admin', 'teacher']:
            raise serializers.ValidationError('Only admin or teacher can rate submissions')
        obj, created = SubmissionRating.objects.update_or_create(submission=validated_data['submission'], rater=user, defaults={'score': validated_data.get('score'), 'comment': validated_data.get('comment', '')})
        return obj