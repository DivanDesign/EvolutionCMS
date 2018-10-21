@extends('manager::template.page')
@section('content')
    @push('scripts.top')
        <script type="text/javascript">
            var actions = {
                delete: function() {
                    if(confirm("{{ $_lang['confirm_delete_eventlog'] }}") === true) {
                        document.location.href = "index.php?id=" + document.resource.id.value + "&a=116";
                    }
                },
                cancel: function() {
                    documentDirty = false;
                    document.location.href = 'index.php?a=114';
                }
            };
        </script>
    @endpush
    <h1>{{ $_lang['eventlog'] }}</h1>

    {!! ManagerTheme::getStyle('actionbuttons.dynamic.canceldelete') !!}

    <?php /** @var EvolutionCMS\Models\EventLog $log */?>
    @if($log->exists)
        <form name="resource" method="get">
            <input type="hidden" name="id" value="{{ $log->getKey() }}" />
            <input type="hidden" name="a" value="{{ $controller->getIndex() }}" />
            <input type="hidden" name="listmode" value="{{ get_by_key($_REQUEST, 'listmode') }}" />
            <input type="hidden" name="op" value="" />
            <div class="tab-page">
                <div class="container container-body">
                    @switch($log->type)
                        @case(EvolutionCMS\Models\EventLog::TYPE_INFORMATION)
                            <p><i class="{{ $_style['actions_info'] }} text-info"></i> {{ $_lang["information"] }}</p>
                            @break
                        @case(EvolutionCMS\Models\EventLog::TYPE_WARNING)
                            <p><i class="{{ $_style['actions_triangle'] }} text-warning"></i> {{ $_lang["warning"] }}</p>
                            @break
                        @case(EvolutionCMS\Models\EventLog::TYPE_ERROR)
                            <p><i class="{{ $_style['actions_error'] }} text-danger"></i> {{ $_lang["error"] }}</p>
                            @break
                        @default:
                            <p>N/A</p>
                    @endswitch

                    <p><b>{{ $log->source }} - {{ $_lang['eventlog_viewer'] }}</b></p>

                    <table class="table">
                        <tr>
                            <td width="25%" valign="top">{{ $_lang["event_id"] }}:</td>
                            <td width="25%" valign="top">{{ $log->eventid }}</td>
                            <td width="25%" valign="top">{{ $_lang["source"] }}:</td>
                            <td width="25%" valign="top">{{ $log->source }}</td>
                        </tr>
                        <tr>
                            <td width="25%" valign="top">{{ $_lang["date"] }}:</td>
                            <td width="25%" valign="top">{{ $log->created_at->format('Y-m-d H:i:s') }}</td>
                            <td width="25%" valign="top">{{ $_lang["user"] }}:</td>
                            <td width="25%" valign="top">{{ $log->getUser() !== null ? $log->getUser()->username : '-' }}</td>
                        </tr>
                        <tr>
                            <td width="100%" colspan="4"><br />
                                {{ $log->description }}
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        </form>
    @endif
@endsection
